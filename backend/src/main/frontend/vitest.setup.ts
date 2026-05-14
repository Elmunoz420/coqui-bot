import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './src/httpmocks/node';

beforeAll(() => server.listen());

afterEach(() => server.resetHandlers());

afterAll(() => server.close());
