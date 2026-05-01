import {
  calculateLoanEstimate,
  memberLoanService,
  normalizeApplicationState,
  normalizeLoanState,
} from '../memberLoanService';

const mockApiGet = jest.fn();
const mockPreviewLoanEligibility = jest.fn();
const mockSubmitLoanApplication = jest.fn();
const mockGetLoanApplications = jest.fn();
const mockGetLoans = jest.fn();

jest.mock('../api', () => ({
  apiClient: {
    get: (...args: unknown[]) => mockApiGet(...args),
  },
}));

jest.mock('../financeService', () => ({
  financeService: {
    previewLoanEligibility: (...args: unknown[]) => mockPreviewLoanEligibility(...args),
    submitLoanApplication: (...args: unknown[]) => mockSubmitLoanApplication(...args),
    getLoanApplications: (...args: unknown[]) => mockGetLoanApplications(...args),
    getLoans: (...args: unknown[]) => mockGetLoans(...args),
  },
}));

describe('memberLoanService loan workflow contract', () => {
  beforeEach(() => {
    mockApiGet.mockReset();
    mockPreviewLoanEligibility.mockReset();
    mockSubmitLoanApplication.mockReset();
    mockGetLoanApplications.mockReset();
    mockGetLoans.mockReset();
  });

  it('forwards preview eligibility inputs to the finance service', async () => {
    mockPreviewLoanEligibility.mockResolvedValue({ eligible: true, recommended_max_amount: '15000.00', reasons: [] });

    await memberLoanService.previewEligibility('chama-1', {
      amount: '12000.00',
      durationMonths: 6,
      purpose: 'School fees',
      loanProductId: 'product-1',
    });

    expect(mockPreviewLoanEligibility).toHaveBeenCalledWith('chama-1', {
      principal: '12000.00',
      duration_months: 6,
      purpose: 'School fees',
      loan_product_id: 'product-1',
    });
  });

  it('combines purpose and note when submitting a loan application', async () => {
    mockSubmitLoanApplication.mockResolvedValue({ id: 'application-1' });

    await memberLoanService.submitApplication('chama-1', {
      amount: '8000.00',
      durationMonths: 4,
      purpose: 'Emergency support',
      note: 'Need to settle medical bills',
      loanProductId: 'product-1',
    });

    expect(mockSubmitLoanApplication).toHaveBeenCalledWith('chama-1', {
      requested_amount: '8000.00',
      requested_term_months: 4,
      purpose: 'Emergency support\n\nNeed to settle medical bills',
      loan_product_id: 'product-1',
    });
  });

  it('merges loan applications and active loans into a member history feed', async () => {
    mockGetLoanApplications.mockResolvedValue([
      {
        id: 'application-1',
        status: 'submitted',
        requested_amount: '9000.00',
        purpose: 'Business stock',
        submitted_at: '2026-04-10T10:00:00Z',
        approved_at: null,
        reviewed_at: null,
        created_loan: null,
      },
    ]);
    mockGetLoans.mockResolvedValue([
      {
        id: 'loan-1',
        status: 'active',
        principal: '12000.00',
        purpose: 'Expansion',
        requested_at: '2026-04-11T10:00:00Z',
        approved_at: '2026-04-12T10:00:00Z',
      },
    ]);

    const history = await memberLoanService.getHistory('chama-1');

    expect(history).toHaveLength(2);
    expect(history[0]).toMatchObject({
      recordType: 'loan',
      loanState: 'active',
      loanId: 'loan-1',
    });
    expect(history[1]).toMatchObject({
      recordType: 'application',
      applicationState: 'submitted_pending_review',
      applicationId: 'application-1',
    });
  });

  it('keeps helper status normalizers aligned with the member workflow', () => {
    expect(normalizeApplicationState('committee_approved')).toBe('submitted_pending_review');
    expect(normalizeLoanState('defaulted')).toBe('overdue');
    expect(normalizeLoanState('paid')).toBe('completed');
  });

  it('calculates a flat-rate repayment estimate', () => {
    const estimate = calculateLoanEstimate({
      amount: '12000.00',
      durationMonths: 6,
      interestRate: '12',
      interestType: 'flat',
    });

    expect(estimate.installmentAmount).toBe('2120.00');
    expect(estimate.totalRepayment).toBe('12720.00');
    expect(estimate.totalInterest).toBe('720.00');
  });
});
