import { inspections } from "../../../lib/data/inspections";

export function GET() {
  return Response.json(
    { inspections },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
