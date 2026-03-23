import { NextResponse } from 'next/server';

const COOKIE_NAME = process.env.NEXT_PUBLIC_STRAPI_TOKEN_COOKIE || 'strapi_jwt';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(COOKIE_NAME);
  return response;
}
