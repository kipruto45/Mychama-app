import { financeService } from '../financeService';

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPut = jest.fn();
const mockPatch = jest.fn();
const mockDelete = jest.fn();

jest.mock('../api', () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    put: (...args: unknown[]) => mockPut(...args),
    patch: (...args: unknown[]) => mockPatch(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
}));

describe('financeService transactions feed contracts', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
    mockPut.mockReset();
    mockPatch.mockReset();
    mockDelete.mockReset();
  });

  it('loads the unified transactions feed and unwraps ApiResponse.data', async () => {
    mockGet.mockResolvedValue({
      success: true,
      data: {
        items: [
          {
            ref: 'journal_1',
            source: 'journal_entry',
            source_id: '1',
            event_at: '2026-04-30T10:00:00Z',
            category: 'inflow',
            direction: 'inflow',
            type: 'contribution',
            title: 'Member Contribution',
            amount: '100.00',
            currency: 'KES',
            status: 'success',
            method: 'mpesa',
          },
        ],
        pagination: { limit: 50, next_cursor: null },
      },
    });

    const page = await financeService.getAllTransactionsFeed('chama-1', {
      category: 'inflow',
      status: 'success',
      method: 'mpesa',
      entry_type: 'contribution',
      search: 'TXN-1',
      limit: 50,
    });

    expect(page.items).toHaveLength(1);
    expect(page.items[0].ref).toBe('journal_1');

    const url = mockGet.mock.calls[0][0] as string;
    expect(url).toContain('/v1/finance/transactions?');
    expect(url).toContain('chama_id=chama-1');
    expect(url).toContain('category=inflow');
    expect(url).toContain('status=success');
    expect(url).toContain('method=mpesa');
    expect(url).toContain('entry_type=contribution');
    expect(url).toContain('search=TXN-1');
    expect(url).toContain('limit=50');
  });

  it('loads transaction detail and unwraps the transaction payload', async () => {
    mockGet.mockResolvedValue({
      success: true,
      data: {
        transaction: {
          ref: 'payment_123',
          source: 'payment_intent',
          source_id: '123',
          event_at: '2026-04-30T10:00:00Z',
          category: 'inflow',
          direction: 'inflow',
          type: 'payment',
          title: 'Payment',
          amount: '250.00',
          currency: 'KES',
          status: 'pending',
          method: 'mpesa',
        },
      },
    });

    const transaction = await financeService.getTransactionDetail('chama-1', 'payment_123');
    expect(transaction.ref).toBe('payment_123');

    const url = mockGet.mock.calls[0][0] as string;
    expect(url).toContain('/v1/finance/transactions/payment_123?');
    expect(url).toContain('chama_id=chama-1');
  });
});

