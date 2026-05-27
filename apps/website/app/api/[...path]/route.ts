import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.API_URL || "http://localhost:3333/api";
const API_KEY = process.env.API_KEY || "";

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const url = `${BACKEND_URL}/${path.join("/")}${req.nextUrl.search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "host") headers.set(key, value);
  });
  if (API_KEY) headers.set("x-api-key", API_KEY);

  const method = req.method;
  const body =
    method !== "GET" && method !== "HEAD"
      ? Buffer.from(await req.arrayBuffer())
      : undefined;

  try {
    const res = await fetch(url, { method, headers, body, cache: "no-store" });

    const resHeaders = new Headers();
    res.headers.forEach((value, key) => {
      if (!["connection", "keep-alive", "transfer-encoding", "content-encoding"].includes(key.toLowerCase())) {
        resHeaders.set(key, value);
      }
    });

    return new NextResponse(res.body, { status: res.status, headers: resHeaders });
  } catch {
    return NextResponse.json({ message: "No se pudo conectar con el servidor" }, { status: 502 });
  }
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
