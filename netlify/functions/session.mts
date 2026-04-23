import { getStore } from "@netlify/blobs";
import type { Context, Config } from "@netlify/functions";

// Session IDs must be 6-32 chars, lowercase alphanumeric, to prevent weird/abusive keys
const VALID_SESSION = /^[a-z0-9]{6,32}$/;

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("session") || "";

  if (!VALID_SESSION.test(sessionId)) {
    return new Response(
      JSON.stringify({ error: "Invalid session ID" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const store = getStore("homework-sessions");
  const key = `session-${sessionId}`;

  try {
    if (req.method === "GET") {
      const data = await store.get(key, { type: "json" });
      return new Response(
        JSON.stringify({ answers: data || {} }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (req.method === "POST" || req.method === "PUT") {
      const body = await req.json().catch(() => null);
      if (!body || typeof body !== "object" || !body.answers) {
        return new Response(
          JSON.stringify({ error: "Invalid body" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      await store.setJSON(key, {
        answers: body.answers,
        updatedAt: new Date().toISOString()
      });
      return new Response(
        JSON.stringify({ ok: true }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const config: Config = {
  path: "/api/session"
};
