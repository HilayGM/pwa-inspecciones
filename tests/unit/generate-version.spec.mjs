import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, it } from "node:test";
import {
  generateVersion,
  isValidSemVer,
  parseSourceDateEpoch,
  resolveGenerationDate,
  resolveSha,
} from "../../scripts/generate-version.mjs";

const temporaryDirectories = [];

async function createProject(version = "0.10.0") {
  const root = await mkdtemp(join(tmpdir(), "pwa-version-test-"));
  temporaryDirectories.push(root);
  await writeFile(join(root, "package.json"), JSON.stringify({ version }));
  return root;
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

describe("generate-version", () => {
  it("lee la versión desde package.json y genera el JSON aislado", async () => {
    const root = await createProject("1.2.3");
    const outputPath = join(root, "generated", "version.json");
    const payload = generateVersion({
      root,
      outputPath,
      env: { GIT_COMMIT_SHA: "abcdef1", SOURCE_DATE_EPOCH: "0" },
    });

    assert.deepEqual(payload, {
      version: "1.2.3",
      sha: "abcdef1",
      date: "1970-01-01T00:00:00.000Z",
      shaSource: "GIT_COMMIT_SHA",
    });
    assert.deepEqual(JSON.parse(await readFile(outputPath, "utf8")), payload);
  });

  it("obtiene el SHA mediante Git cuando no hay variables configuradas", () => {
    const result = resolveSha({
      env: {},
      execGit: () => "0123456789abcdef0123456789abcdef01234567\n",
    });

    assert.deepEqual(result, {
      sha: "0123456789abcdef0123456789abcdef01234567",
      shaSource: "git",
    });
  });

  it("prioriza GIT_COMMIT_SHA sobre VERSION_SHA y Git", () => {
    const result = resolveSha({
      env: { GIT_COMMIT_SHA: "abcdef1", VERSION_SHA: "1234567" },
      execGit: () => {
        throw new Error("Git no debe invocarse");
      },
    });

    assert.deepEqual(result, { sha: "abcdef1", shaSource: "GIT_COMMIT_SHA" });
  });

  it("usa VERSION_SHA como alternativa y conserva su procedencia", () => {
    const result = resolveSha({ env: { VERSION_SHA: "1234567" } });
    assert.deepEqual(result, { sha: "1234567", shaSource: "VERSION_SHA" });
  });

  it("rechaza un SHA configurado con caracteres o longitud inválidos", () => {
    assert.throws(
      () => resolveSha({ env: { GIT_COMMIT_SHA: "not-a-sha" } }),
      /GIT_COMMIT_SHA.*SHA hexadecimal válido/,
    );
    assert.throws(
      () => resolveSha({ env: { VERSION_SHA: "abc" } }),
      /VERSION_SHA.*SHA hexadecimal válido/,
    );
  });

  it("usa unavailable cuando Git no está disponible y no se exige SHA", () => {
    const result = resolveSha({
      env: {},
      execGit: () => {
        throw new Error("git no disponible");
      },
    });

    assert.deepEqual(result, { sha: "unavailable", shaSource: "unavailable" });
  });

  it("falla cuando REQUIRE_GIT_SHA=true y no existe SHA", () => {
    assert.throws(
      () =>
        resolveSha({
          env: { REQUIRE_GIT_SHA: "true" },
          execGit: () => {
            throw new Error("git no disponible");
          },
        }),
      /No fue posible obtener el SHA de Git/,
    );
  });

  it("convierte SOURCE_DATE_EPOCH a ISO 8601 UTC", () => {
    assert.deepEqual(resolveGenerationDate({ env: { SOURCE_DATE_EPOCH: "1" } }), {
      date: "1970-01-01T00:00:01.000Z",
      dateSource: "SOURCE_DATE_EPOCH",
    });
  });

  it("rechaza SOURCE_DATE_EPOCH inválido", () => {
    assert.throws(
      () => parseSourceDateEpoch("not-a-number"),
      /SOURCE_DATE_EPOCH debe ser un número entero/,
    );
    assert.throws(
      () => parseSourceDateEpoch("9007199254740992"),
      /fuera del rango seguro/,
    );
  });

  it("valida versiones SemVer normales, prerelease y metadata", () => {
    for (const version of [
      "0.10.0",
      "1.0.0",
      "1.2.3",
      "1.0.0-alpha.1",
      "1.0.0-beta.2",
      "1.0.0+build.15",
    ]) {
      assert.equal(isValidSemVer(version), true, version);
    }

    for (const version of ["0.10", "1.0", "abc", "01.02.003", ""]) {
      assert.equal(isValidSemVer(version), false, version);
    }
  });

  it("usa la fecha actual solo como fallback controlado", () => {
    assert.deepEqual(
      resolveGenerationDate({ env: {}, now: Date.parse("2026-11-04T00:00:00.000Z") }),
      { date: "2026-11-04T00:00:00.000Z", dateSource: "clock" },
    );
  });
});
