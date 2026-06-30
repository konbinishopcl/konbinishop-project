// Entry serverless de Vercel. Es JS plano que requiere el `dist/` ya compilado
// por `nest build` — así @vercel/node NO re-type-checkea toda la app NestJS
// (evita el TS2305 de @prisma/client en el contexto de build de la función).
// Reutiliza la instancia Express entre invocaciones (Fluid Compute reusa el proceso).
const { createApp } = require('../dist/src/main.js');

let cached = null;

async function getHandler() {
  if (!cached) {
    const app = await createApp();
    cached = app.getHttpAdapter().getInstance();
  }
  return cached;
}

module.exports = async (req, res) => {
  const express = await getHandler();
  express(req, res);
};
