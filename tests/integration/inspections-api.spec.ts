import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GET } from "../../src/app/api/inspecciones/route";
import { inspections } from "../../src/lib/data/inspections";

describe("API sintÃ©tica de inspecciones", () => {
  it("integra el handler GET con los datos y la polÃ­tica no-store", async () => {
    const response = GET();
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.deepEqual(await response.json(), { inspections });
    assert.ok(inspections.some((inspection) => inspection.id === "inspection-001"));
  });
});
