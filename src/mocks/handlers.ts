import { rest } from 'msw';

export const handlers = [
  rest.get('/api/hello', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ message: 'Hello, world!' }));
  }),
];
