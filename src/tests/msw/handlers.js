import { http, HttpResponse } from 'msw';

/**
 * Handlers globais para MSW.
 * Cada módulo pode estender com `server.use(...)` dentro dos testes.
 */
export const handlers = [
  // Placeholder: respostas padrão do Supabase REST podem ser adicionadas aqui.
  http.get('*/rest/v1/healthcheck', () => HttpResponse.json({ ok: true })),
];
