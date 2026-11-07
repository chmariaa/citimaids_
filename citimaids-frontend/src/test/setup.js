import '@testing-library/jest-dom/vitest';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import axios from 'axios';
import api from '../api/axios';
import { server } from './mocks/server';

// Ensure both global axios and configured api instance use fetch
axios.defaults.adapter = 'fetch';
api.defaults.adapter = 'fetch';

// Start MSW server before tests run
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));

// Reset handlers and unmount components after each test
afterEach(() => {
  server.resetHandlers();
  cleanup();
});

// Close MSW server when all tests are done
afterAll(() => server.close());
