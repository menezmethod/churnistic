import { RedditAPI } from '../reddit';

describe('RedditAPI', () => {
  let api: RedditAPI;

  beforeEach(() => {
    process.env.REDDIT_API_TOKEN = 'test-token';
    api = new RedditAPI();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should fetch churning posts', async () => {
    const mockResponse = {
      data: {
        children: [
          {
            data: {
              title: 'Test Post',
              selftext: 'Test Content',
              permalink: '/r/churning/test',
              created_utc: 1234567890,
              score: 100,
              author: 'testuser'
            }
          }
        ]
      }
    };

    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve(mockResponse)
    });

    const posts = await api.getChurningPosts({ timeframe: 'day' });
    
    expect(posts).toHaveLength(1);
    expect(posts[0]).toEqual({
      title: 'Test Post',
      selftext: 'Test Content',
      permalink: '/r/churning/test',
      created_utc: 1234567890,
      score: 100,
      author: 'testuser'
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/r/churning/search.json'),
      expect.objectContaining({
        headers: {
          'Authorization': 'Bearer test-token',
          'User-Agent': 'Churnistic/1.0.0'
        }
      })
    );
  });

  it('should fetch post comments', async () => {
    const mockResponse = [{ /* mock comment data */ }];

    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve(mockResponse)
    });

    const comments = await api.getPostComments('test-post-id');
    
    expect(comments).toEqual(mockResponse);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/r/churning/comments/test-post-id.json'),
      expect.objectContaining({
        headers: {
          'Authorization': 'Bearer test-token',
          'User-Agent': 'Churnistic/1.0.0'
        }
      })
    );
  });
}); 