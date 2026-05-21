import { NextRequest, NextResponse } from "next/server";

const BACKEND_ORIGIN = process.env.API_URL?.replace(/\/api$/, "") || "http://localhost:3333";

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const url = `${BACKEND_ORIGIN}/${path.join("/")}`;

  let upstream: Response;
  try {
    upstream = await fetch(url, { cache: "no-store" });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  if (!upstream.ok) return new NextResponse("Not found", { status: 404 });

  const body = await upstream.arrayBuffer();
  const contentType = upstream.headers.get("content-type") || "application/octet-stream";

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "CDN-Cache-Control": "public, max-age=31536000",
    },
  });
}
