// Liveness probe for the container healthcheck. Answers without touching the
// database or any other service, so a slow dependency never gets the container killed.
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
}
