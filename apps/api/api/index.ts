import type { IncomingMessage, ServerResponse } from 'http';
import { createApp } from '../src/main';

// Reutiliza la instancia Express entre invocaciones (Fluid Compute reusa el
// proceso), así el arranque de Nest solo ocurre en el primer request.
type ExpressHandler = (req: IncomingMessage, res: ServerResponse) => void;
let cached: ExpressHandler | null = null;

async function getHandler(): Promise<ExpressHandler> {
  if (!cached) {
    const app = await createApp();
    cached = app.getHttpAdapter().getInstance() as ExpressHandler;
  }
  return cached;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const express = await getHandler();
  express(req, res);
}
