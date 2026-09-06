export function GET() {
  return Response.json(
    { status: "ok", application: "barberfox", stage: 0, timestamp: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
