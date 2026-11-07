import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('http://localhost:8000/api/services', () => {
    return HttpResponse.json([
      {
        id: 1,
        name: 'Standard Cleaning',
        category: 'residential',
        status: 'active',
        display_order: 1,
      },
    ]);
  }),

  http.get('http://localhost:8000/api/settings', () => {
    return HttpResponse.json({
      business_name: 'CitiMaids Cleaning Services',
      contact_number: '+971 52 634 9461',
      business_email: 'info@citi-maids.com',
    });
  }),
];
