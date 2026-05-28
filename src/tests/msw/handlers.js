import { http, HttpResponse } from 'msw';

export const handlers = [http.get('*/rest/v1/healthcheck', () => HttpResponse.json({ ok: true }))];
