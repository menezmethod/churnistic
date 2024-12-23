import { RedditAPI } from '../reddit';

// Mock fetch
global.fetch = jest.fn();

describe('RedditAPI', () => {
  let api: RedditAPI;

  beforeEach(() => {
    api = new RedditAPI();
    (fetch as jest.Mock).mockClear();
  });

  it('should get weekly threads', async () => {
    // Mock the OAuth token response
    (fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: 'mock_access_token',
            token_type: 'bearer',
            expires_in: 3600,
            scope: '*',
          }),
        headers: new Headers({
          'x-ratelimit-used': '1',
          'x-ratelimit-remaining': '599',
          'x-ratelimit-reset': '3600',
        }),
      })
    );

    // Mock the weekly threads response
    (fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              children: [
                {
                  data: {
                    title: 'Weekly Thread',
                    selftext: 'Weekly thread content',
                    permalink: '/r/churning/comments/123/weekly_thread',
                    created_utc: 1234567890,
                  },
                },
              ],
            },
          }),
        headers: new Headers({
          'x-ratelimit-used': '2',
          'x-ratelimit-remaining': '598',
          'x-ratelimit-reset': '3600',
        }),
      })
    );

    const threads = await api.getWeeklyThreads();
    expect(threads).toBeDefined();
    expect(Array.isArray(threads)).toBe(true);
    expect(threads.length).toBeGreaterThan(0);
    expect(threads[0]).toHaveProperty('title');
    expect(threads[0]).toHaveProperty('selftext');
    expect(threads[0]).toHaveProperty('permalink');
    expect(threads[0]).toHaveProperty('created_utc');
  });

  it('should get post comments', async () => {
    // Mock the OAuth token response
    (fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: 'mock_access_token',
            token_type: 'bearer',
            expires_in: 3600,
            scope: '*',
          }),
        headers: new Headers({
          'x-ratelimit-used': '3',
          'x-ratelimit-remaining': '597',
          'x-ratelimit-reset': '3600',
        }),
      })
    );

    // Mock the comments response
    (fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              data: {
                children: [
                  {
                    data: {
                      title: 'Post Title',
                      selftext: 'Post content',
                    },
                  },
                ],
              },
            },
            {
              data: {
                children: [
                  {
                    data: {
                      body: 'Comment content',
                      author: 'user123',
                      created_utc: 1234567890,
                    },
                  },
                ],
              },
            },
          ]),
        headers: new Headers({
          'x-ratelimit-used': '4',
          'x-ratelimit-remaining': '596',
          'x-ratelimit-reset': '3600',
        }),
      })
    );

    const comments = await api.getPostComments('123');
    expect(comments).toBeDefined();
    expect(Array.isArray(comments)).toBe(true);
    expect(comments.length).toBeGreaterThan(0);
    expect(comments[0]).toHaveProperty('body');
    expect(comments[0]).toHaveProperty('author');
    expect(comments[0]).toHaveProperty('created_utc');
  });
});
