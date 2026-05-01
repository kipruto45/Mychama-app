import { announcementService } from '../announcementService';

const mockGet = jest.fn();

jest.mock('../api', () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
  },
}));

describe('announcementService feed contracts', () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it('queries the announcements feed endpoint with expected params', async () => {
    mockGet.mockResolvedValue({
      results: [],
      count: 0,
      page: 2,
      page_size: 50,
      has_next: false,
    });

    await announcementService.getFeed({
      chamaId: 'chama-1',
      unread: true,
      page: 2,
      pageSize: 50,
    });

    expect(mockGet).toHaveBeenCalledWith(
      '/v1/notifications/announcements/feed?chama_id=chama-1&unread=true&page=2&page_size=50'
    );
  });
});

