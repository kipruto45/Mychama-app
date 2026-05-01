import { apiClient } from './api';

export type FinanceReportType =
  | 'member-statement'
  | 'loan-statement'
  | 'chama-summary'
  | 'loan-schedule';

export interface FinanceReportItem {
  label: string;
  value: string;
}

export interface FinanceReportSection {
  title: string;
  items: FinanceReportItem[];
}

export interface FinanceReportResult {
  type: FinanceReportType;
  title: string;
  generatedAt: string | null;
  summary: FinanceReportItem[];
  sections: FinanceReportSection[];
  raw: unknown;
}

const REPORT_TITLES: Record<FinanceReportType, string> = {
  'member-statement': 'Member Statement',
  'loan-statement': 'Loan Statement',
  'chama-summary': 'Chama Summary',
  'loan-schedule': 'Loan Schedule',
};

const REPORT_ENDPOINTS: Record<FinanceReportType, string> = {
  'member-statement': '/v1/reports/member-statement',
  'loan-statement': '/v1/reports/loan-statement',
  'chama-summary': '/v1/reports/chama-summary',
  'loan-schedule': '/v1/reports/loan-schedule',
};

const formatReportValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
};

const normalizeObjectEntries = (data: Record<string, unknown>): FinanceReportItem[] =>
  Object.entries(data).map(([key, value]) => ({
    label: key.replace(/_/g, ' '),
    value: formatReportValue(value),
  }));

const normalizeSections = (data: Record<string, unknown>): FinanceReportSection[] =>
  Object.entries(data)
    .filter(([, value]) => Array.isArray(value) || (typeof value === 'object' && value !== null))
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        const arrayItems = value.flatMap((entry, index) => {
          if (entry && typeof entry === 'object') {
            return normalizeObjectEntries(entry as Record<string, unknown>).map((item) => ({
              label: `${index + 1}. ${item.label}`,
              value: item.value,
            }));
          }

          return [{ label: `${index + 1}`, value: formatReportValue(entry) }];
        });

        return {
          title: key.replace(/_/g, ' '),
          items: arrayItems,
        };
      }

      return {
        title: key.replace(/_/g, ' '),
        items: normalizeObjectEntries(value as Record<string, unknown>),
      };
    })
    .filter((section) => section.items.length > 0);

const normalizeReport = (
  type: FinanceReportType,
  response: unknown
): FinanceReportResult => {
  const title = REPORT_TITLES[type];

  if (Array.isArray(response)) {
    return {
      type,
      title,
      generatedAt: null,
      summary: [{ label: 'items', value: String(response.length) }],
      sections: [
        {
          title: 'report items',
          items: response.flatMap((entry, index) => {
            if (entry && typeof entry === 'object') {
              return normalizeObjectEntries(entry as Record<string, unknown>).map((item) => ({
                label: `${index + 1}. ${item.label}`,
                value: item.value,
              }));
            }

            return [{ label: `${index + 1}`, value: formatReportValue(entry) }];
          }),
        },
      ],
      raw: response,
    };
  }

  if (response && typeof response === 'object') {
    const data = response as Record<string, unknown>;
    const generatedAt =
      typeof data.generated_at === 'string'
        ? data.generated_at
        : typeof data.created_at === 'string'
        ? data.created_at
        : null;

    const summarySource =
      data.summary && typeof data.summary === 'object' && !Array.isArray(data.summary)
        ? (data.summary as Record<string, unknown>)
        : Object.fromEntries(
            Object.entries(data).filter(([, value]) => !Array.isArray(value) && typeof value !== 'object')
          );

    return {
      type,
      title,
      generatedAt,
      summary: normalizeObjectEntries(summarySource),
      sections: normalizeSections(data),
      raw: response,
    };
  }

  return {
    type,
    title,
    generatedAt: null,
    summary: [{ label: 'value', value: formatReportValue(response) }],
    sections: [],
    raw: response,
  };
};

export const reportService = {
  async getReport(
    type: FinanceReportType,
    params?: Record<string, string | undefined>
  ): Promise<FinanceReportResult> {
    const query = new URLSearchParams(
      Object.entries(params || {}).filter(([, value]) => Boolean(value)) as Array<[string, string]>
    ).toString();
    const endpoint = `${REPORT_ENDPOINTS[type]}${query ? `?${query}` : ''}`;
    const response = await apiClient.get<unknown>(endpoint);
    return normalizeReport(type, response);
  },
};
