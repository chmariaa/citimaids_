import '@testing-library/jest-dom/vitest';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './mocks/server';

// Start MSW server before tests run
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));

// Reset MSW handlers and unmount React DOM trees after each test
afterEach(() => {
  server.resetHandlers();
  cleanup();
});

// Close MSW server when all test suites finish
afterAll(() => server.close());
