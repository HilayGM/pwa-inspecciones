import { inspections, type Inspection } from "../../../lib/data/inspections";
import {
  getSecurityHeaders,
  validateAndSanitizeInspection,
  validateInspectionId,
  validateSearchQuery,
} from "../../../lib/security";

export function GET(request: Request): Response;
export function GET(): Response;
export function GET(request?: Request): Response {
  const responseHeaders = {
    "Cache-Control": "no-store",
    ...getSecurityHeaders(),
  };

  if (request) {
    const url = new URL(request.url);
    const idParam = url.searchParams.get("id");
    if (idParam !== null) {
      const idCheck = validateInspectionId(idParam);
      if (!idCheck.valid) {
        return Response.json(
          { error: idCheck.error ?? "ID de inspección inválido." },
          { status: 400, headers: responseHeaders },
        );
      }
    }

    const queryParam = url.searchParams.get("q");
    if (queryParam !== null) {
      validateSearchQuery(queryParam);
    }
  }

  const sanitizedInspections: Inspection[] = inspections
    .map((item) => {
      const check = validateAndSanitizeInspection(item);
      return check.valid && check.data ? check.data : null;
    })
    .filter((item): item is Inspection => item !== null);

  return Response.json(
    { inspections: sanitizedInspections },
    {
      headers: responseHeaders,
    },
  );
}
