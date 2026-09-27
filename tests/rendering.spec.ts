import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { test } from "node:test";
import type * as TS from "typescript";

const root = resolve(import.meta.dirname, "..");
const listingPath = "src/app/inspecciones/page.tsx";
const detailPath = "src/app/inspecciones/[id]/page.tsx";
const loadingPath = "src/components/loading-state.tsx";

// Contratos de código fuente: no ejecutan React ni acreditan un HTTP 404 real.
// Se aceptan comillas simples/dobles, espacios y las construcciones indicadas.
async function source(path: string): Promise<string> {
  const absolute = resolve(root, path);
  assert.ok(
    await stat(absolute).then((entry) => entry.isFile(), () => false),
    `Falta el archivo requerido ${path}.${path === detailPath ? " Dependencia pendiente: detalle SSR de Felipe; no se omite este contrato." : ""}`,
  );
  const text = await readFile(absolute, "utf8");
  // Ignorar comentarios conservando cadenas y plantillas usadas por los contratos.
  return text.replace(
    /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|\/\*[\s\S]*?\*\/|\/\/[^\r\n]*/g,
    (match, literal: string | undefined) => literal ?? " ",
  );
}

// Análisis contractual local, no ejecución de React ni interpretación completa.
// TypeScript ya pertenece a las devDependencies. Se carga después de comprobar
// el archivo: la ausencia del detalle siempre produce el mensaje contractual.
// Se siguen bindings/alias locales, búsquedas con find y callbacks alcanzables;
// una extracción a otro módulo requiere ampliar este análisis, no omitirlo.
async function inspect(path: string) {
  const text = await source(path);
  const { default: ts } = await import("typescript");
  const filename = resolve(root, path);
  const file = ts.createSourceFile(filename, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const options = { noLib: true, noResolve: true, types: [], jsx: ts.JsxEmit.Preserve };
  const host = ts.createCompilerHost(options);
  // TypeScript normaliza los nombres raíz antes de pedirlos al host (en Windows
  // suele cambiar `C:\...` por `C:/...`). Comparar el texto literalmente dejaba
  // este SourceFile fuera del Program: el AST seguía visible, pero el checker no
  // podía resolver `variant`, `isError`, `onRetry` ni el callback de la API.
  const canonical = (name: string) => resolve(name).replaceAll("\\", "/").toLowerCase();
  const canonicalFilename = canonical(filename);
  host.getSourceFile = (name) => canonical(name) === canonicalFilename ? file : undefined;
  host.fileExists = (name) => canonical(name) === canonicalFilename;
  host.readFile = (name) => canonical(name) === canonicalFilename ? text : undefined;
  const program = ts.createProgram([filename], options, host);
  const programFile = program.getSourceFile(filename);
  assert.equal(programFile, file, `No se pudo enlazar ${path} al analizador TypeScript.`);
  const checker = program.getTypeChecker();

  function nodes(node: TS.Node): TS.Node[] {
    if (ts.isTypeNode(node)) return [];
    const result = [node];
    ts.forEachChild(node, (child) => { result.push(...nodes(child)); });
    return result;
  }

  function unwrap(node: TS.Node): TS.Node {
    while (ts.isParenthesizedExpression(node) || ts.isAwaitExpression(node)
      || ts.isAsExpression(node) || ts.isNonNullExpression(node)
      || ts.isSatisfiesExpression(node)) node = node.expression;
    return node;
  }

  function declaration(node: TS.Node): TS.Declaration | undefined {
    return checker.getSymbolAtLocation(node)?.declarations?.[0];
  }

  function initializer(node: TS.Node): TS.Node | undefined {
    const declared = declaration(node);
    return declared && ts.isVariableDeclaration(declared) ? declared.initializer : undefined;
  }

  function functionValue(node: TS.Node, seen = new Set<TS.Node>()): TS.FunctionLikeDeclaration | undefined {
    node = unwrap(node);
    if (seen.has(node)) return undefined;
    seen.add(node);
    if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node)) return node;
    if (ts.isIdentifier(node)) {
      const value = initializer(node) ?? declaration(node);
      if (value) return functionValue(value, seen);
    }
    return undefined;
  }

  const entry = file.statements.map((statement) => {
    if (ts.isFunctionDeclaration(statement)
      && (statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)
        || statement.name?.text === "LoadingState")) return statement;
    if (ts.isExportAssignment(statement)) return functionValue(statement.expression);
    if (ts.isVariableStatement(statement)) {
      const component = statement.declarationList.declarations.find((d) =>
        ts.isIdentifier(d.name) && d.name.text === "LoadingState");
      if (component?.initializer) return functionValue(component.initializer);
    }
    return undefined;
  }).find((value) => value !== undefined);

  type Origin = "props" | "params" | "route-id" | "record" | "record-id" | "variant" | "retry" | undefined;
  function property(base: Origin, key: string): Origin {
    if (base === "props") return ({ params: "params", variant: "variant", onRetry: "retry" } as const)[key as "params" | "variant" | "onRetry"];
    if (key === "id") return base === "params" ? "route-id" : base === "record" ? "record-id" : undefined;
    return undefined;
  }

  function origin(node: TS.Node, record?: TS.ParameterDeclaration, seen = new Set<TS.Node>()): Origin {
    node = unwrap(node);
    if (seen.has(node)) return undefined;
    const next = new Set(seen).add(node);
    if (ts.isIdentifier(node)) {
      const declared = declaration(node);
      return declared ? origin(declared, record, next) : undefined;
    }
    if (ts.isParameter(node)) {
      if (node === record) return "record";
      return node === entry?.parameters[0] ? "props" : undefined;
    }
    if (ts.isVariableDeclaration(node) && node.initializer) return origin(node.initializer, record, next);
    if (ts.isBindingElement(node) && ts.isObjectBindingPattern(node.parent)) {
      const key = node.propertyName ?? node.name;
      if (!ts.isIdentifier(key) && !ts.isStringLiteral(key)) return undefined;
      return property(origin(node.parent.parent, record, next), key.text);
    }
    if (ts.isPropertyAccessExpression(node)) return property(origin(node.expression, record, next), node.name.text);
    if (ts.isElementAccessExpression(node) && ts.isStringLiteral(node.argumentExpression)) {
      return property(origin(node.expression, record, next), node.argumentExpression.text);
    }
    return undefined;
  }

  const equalities = new Set([ts.SyntaxKind.EqualsEqualsToken, ts.SyntaxKind.EqualsEqualsEqualsToken]);
  function lookup(node: TS.Node, seen = new Set<TS.Node>()): boolean {
    node = unwrap(node);
    if (seen.has(node)) return false;
    const next = new Set(seen).add(node);
    if (ts.isIdentifier(node)) {
      const value = initializer(node);
      return !!value && lookup(value, next);
    }
    if (!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression)
      || node.expression.name.text !== "find" || !node.arguments[0]) return false;
    const predicate = functionValue(node.arguments[0]);
    if (!predicate?.body || !predicate.parameters[0]) return false;
    // Solo cuenta la comparación retornada al find, no una coincidencia suelta
    // dentro del callback ni un literal fijo que ignore el parámetro de ruta.
    const returned = ts.isBlock(predicate.body)
      ? predicate.body.statements.filter(ts.isReturnStatement).flatMap((s) => s.expression ? [s.expression] : [])
      : [predicate.body];
    return returned.some((result) => {
      const comparison = unwrap(result);
      if (!ts.isBinaryExpression(comparison) || !equalities.has(comparison.operatorToken.kind)) return false;
      const left = origin(comparison.left, predicate.parameters[0]);
      const right = origin(comparison.right, predicate.parameters[0]);
      return (left === "route-id" && right === "record-id") || (right === "route-id" && left === "record-id");
    });
  }

  function missing(node: TS.Node): boolean | undefined {
    node = unwrap(node);
    if (lookup(node)) return false; // Un resultado verdadero significa presencia.
    if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.ExclamationToken) {
      const inverse = missing(node.operand);
      return inverse === undefined ? undefined : !inverse;
    }
    if (ts.isBinaryExpression(node)) {
      const nullish = (n: TS.Node) => n.kind === ts.SyntaxKind.NullKeyword
        || (ts.isIdentifier(n) && n.text === "undefined") || ts.isVoidExpression(n);
      if ((lookup(node.left) && nullish(unwrap(node.right)))
        || (lookup(node.right) && nullish(unwrap(node.left)))) {
        if (equalities.has(node.operatorToken.kind)) return true;
        if ([ts.SyntaxKind.ExclamationEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken].includes(node.operatorToken.kind)) return false;
      }
    }
    const value = ts.isIdentifier(node) ? initializer(node) : undefined;
    return value && value !== node ? missing(value) : undefined;
  }

  function notFoundCall(node: TS.Node): boolean {
    if (!ts.isCallExpression(node)) return false;
    const imported = declaration(node.expression);
    if (!imported || !ts.isImportSpecifier(imported) || (imported.propertyName ?? imported.name).text !== "notFound") return false;
    const statement = imported.parent.parent.parent;
    return ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)
      && statement.moduleSpecifier.text === "next/navigation";
  }

  // Recorre código del bloque, sin aceptar llamadas en funciones nunca invocadas.
  function executes(node: TS.Node, matches: (candidate: TS.Node) => boolean): boolean {
    if (ts.isFunctionLike(node) || ts.isTypeNode(node)) return false;
    if (matches(node)) return true;
    let found = false;
    ts.forEachChild(node, (child) => { if (executes(child, matches)) found = true; });
    return found;
  }

  function guardedNotFound(node: TS.Node): boolean {
    if (ts.isIfStatement(node) || ts.isConditionalExpression(node)) {
      const condition = ts.isIfStatement(node) ? node.expression : node.condition;
      const absent = missing(condition);
      const branch = ts.isIfStatement(node)
        ? (absent === true ? node.thenStatement : absent === false ? node.elseStatement : undefined)
        : (absent === true ? node.whenTrue : absent === false ? node.whenFalse : undefined);
      return !!branch && executes(branch, notFoundCall);
    }
    if (ts.isBinaryExpression(node)) {
      const operator = node.operatorToken.kind;
      const absent = missing(node.left);
      const fallback = (operator === ts.SyntaxKind.AmpersandAmpersandToken && absent === true)
        || (operator === ts.SyntaxKind.BarBarToken && absent === false)
        || (operator === ts.SyntaxKind.QuestionQuestionToken && lookup(node.left));
      return fallback && executes(node.right, notFoundCall);
    }
    return false;
  }

  // Evaluación simbólica limitada a atributos y condiciones de loading/error.
  const unknown = Symbol("unknown");
  function value(node: TS.Node, state: string, seen = new Set<TS.Node>()): string | boolean | typeof unknown {
    node = unwrap(node);
    if (seen.has(node)) return unknown;
    const next = new Set(seen).add(node);
    if (origin(node) === "variant") return state;
    if (ts.isStringLiteralLike(node)) return node.text;
    if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
    if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
    if (ts.isIdentifier(node)) {
      const assigned = initializer(node);
      return assigned ? value(assigned, state, next) : unknown;
    }
    if (ts.isConditionalExpression(node)) {
      const condition = value(node.condition, state, next);
      return condition === unknown ? unknown : value(condition ? node.whenTrue : node.whenFalse, state, next);
    }
    if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.ExclamationToken) {
      const operand = value(node.operand, state, next);
      return operand === unknown ? unknown : !operand;
    }
    if (ts.isBinaryExpression(node)) {
      const left = value(node.left, state, next), right = value(node.right, state, next);
      if (left === unknown || right === unknown) return unknown;
      if (equalities.has(node.operatorToken.kind)) return left === right;
      if ([ts.SyntaxKind.ExclamationEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken].includes(node.operatorToken.kind)) return left !== right;
      if (node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) return left && right;
      if (node.operatorToken.kind === ts.SyntaxKind.BarBarToken) return left || right;
    }
    return unknown;
  }

  const elements = entry?.body ? nodes(entry.body).filter((n): n is TS.JsxOpeningElement | TS.JsxSelfClosingElement =>
    ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) : [];
  function attribute(element: TS.JsxOpeningElement | TS.JsxSelfClosingElement, name: string): TS.Node | undefined {
    const attr = element.attributes.properties.find((p): p is TS.JsxAttribute => ts.isJsxAttribute(p) && p.name.getText(file) === name);
    if (!attr?.initializer) return undefined;
    return ts.isJsxExpression(attr.initializer) ? attr.initializer.expression : attr.initializer;
  }

  function visible(element: TS.Node, state: string): boolean {
    for (let child = element, parent = child.parent; parent && parent !== entry; child = parent, parent = parent.parent) {
      if (ts.isConditionalExpression(parent) && child !== parent.condition) {
        const condition = value(parent.condition, state);
        if (condition === unknown || Boolean(condition) !== (child === parent.whenTrue)) return false;
      }
      if (ts.isBinaryExpression(parent) && child === parent.right) {
        const condition = value(parent.left, state);
        if (parent.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken && (condition === unknown || !condition)) return false;
        if (parent.operatorToken.kind === ts.SyntaxKind.BarBarToken && (condition === unknown || !!condition)) return false;
      }
      if (ts.isIfStatement(parent) && child !== parent.expression) {
        const condition = value(parent.expression, state);
        if (condition === unknown || Boolean(condition) !== (child === parent.thenStatement)) return false;
      }
    }
    return true;
  }

  function supportsState(state: "loading" | "error"): boolean {
    if (!entry || !nodes(entry).some((n) => ts.isStringLiteralLike(n) && n.text === state)) return false;
    return elements.some((element) => {
      if (!visible(element, state)) return false;
      const read = (name: string) => { const attr = attribute(element, name); return attr ? value(attr, state) : unknown; };
      return state === "error"
        ? read("role") === "alert" || ["assertive", "polite"].includes(String(read("aria-live")))
        : read("role") === "status" || read("aria-busy") === true || read("aria-busy") === "true";
    });
  }

  // Sigue funciones referenciadas por el handler, alias y useCallback, sin
  // depender de su nombre ni aceptar un fetch existente en otra función suelta.
  function handlerReaches(node: TS.Node, target: "api" | "retry", seen = new Set<TS.Node>()): boolean {
    node = unwrap(node);
    if (seen.has(node)) return false;
    const next = new Set(seen).add(node);
    if (target === "retry" && origin(node) === "retry") return true;
    if (ts.isIdentifier(node)) {
      const assigned = initializer(node) ?? declaration(node);
      return !!assigned && handlerReaches(assigned, target, next);
    }
    if (ts.isCallExpression(node)
      && /^(?:React\.)?useCallback$/.test(node.expression.getText(file)) && node.arguments[0]) {
      return handlerReaches(node.arguments[0], target, next);
    }
    const fn = functionValue(node);
    if (!fn?.body) return false;
    return executes(fn.body, (candidate) => {
      if (!ts.isCallExpression(candidate)) return false;
      if (target === "api" && ts.isIdentifier(candidate.expression) && candidate.expression.text === "fetch"
        && candidate.arguments[0] && value(candidate.arguments[0], "") === "/api/inspecciones") return true;
      return handlerReaches(candidate.expression, target, next);
    });
  }

  return {
    hasRouteLookup: () => !!entry?.body && nodes(entry.body).some((node) => ts.isCallExpression(node) && lookup(node)),
    hasMissingGuard: () => !!entry?.body && nodes(entry.body).some(guardedNotFound),
    supportsState,
    hasRetry: (tag: string, attr: string, target: "api" | "retry") => elements.some((element) => {
      const handler = attribute(element, attr);
      return element.tagName.getText(file) === tag && !!handler && handlerReaches(handler, target);
    }),
  };
}

test("01: existe la página del listado", async () => {
  await source(listingPath);
});

test("02: existe la página del detalle SSR de Felipe", async () => {
  await source(detailPath);
});

test("03: el listado declara use client", async () => {
  assert.match(await source(listingPath), /^\s*["']use client["']\s*;?/, "El listado debe declarar use client al inicio del módulo.");
});

test("04: el listado consulta la API de inspecciones", async () => {
  assert.match(await source(listingPath), /\bfetch\s*\(\s*["'`]\/api\/inspecciones["'`]/, "El listado debe consultar /api/inspecciones mediante fetch.");
});

test("05: el listado renderiza LoadingState", async () => {
  assert.match(await source(listingPath), /<LoadingState\b/, "El listado debe renderizar LoadingState, no solo importarlo.");
});

test("06: el listado enlaza al detalle mediante el ID de la inspección", async () => {
  const listing = await source(listingPath);
  assert.match(
    listing,
    /\bhref\s*=\s*\{\s*(?:`\/inspecciones\/\$\{\s*[A-Za-z_$][\w$]*\.id\s*\}`|["']\/inspecciones\/["']\s*\+\s*[A-Za-z_$][\w$]*\.id)\s*\}/,
    "Se espera href={`/inspecciones/${inspection.id}`} o concatenación equivalente con el ID del registro.",
  );
});

test("07: el detalle no declara use client", async () => {
  assert.doesNotMatch(await source(detailPath), /(?:^|[;\r\n])\s*["']use client["']\s*;?/, "El detalle debe conservarse como Server Component sin use client.");
});

test("08: el detalle obtiene y utiliza el ID de params o de la URL", async () => {
  const detail = await inspect(detailPath);
  assert.ok(detail.hasRouteLookup(), "El detalle debe localizar el registro con find comparando su id con params.id recibido por la página, directamente o mediante bindings/alias locales. Un tipo o un ID fijo no satisfacen el contrato.");
});

test("09: el detalle usa notFound de Next para un ID inexistente", async () => {
  const detail = await inspect(detailPath);
  assert.ok(detail.hasMissingGuard(), "notFound, importado de next/navigation, debe estar en la rama de ausencia del registro buscado por ID (if/else, ternario, &&, || o ??). Una llamada incondicional no basta.");
});

test("10: existe el componente LoadingState", async () => {
  await source(loadingPath);
});

test("11: LoadingState admite carga y la comunica como estado", async () => {
  const loading = await inspect(loadingPath);
  assert.ok(loading.supportsState("loading"), "LoadingState debe soportar loading y comunicarlo mediante role=status o aria-busy=true, con atributos literales o expresiones equivalentes.");
});

test("12: LoadingState admite error y lo comunica como alerta", async () => {
  const loading = await inspect(loadingPath);
  assert.ok(loading.supportsState("error"), "LoadingState debe soportar error y anunciarlo mediante role=alert o aria-live=assertive/polite; no se exige un nombre interno ni una comparación escrita de una sola forma.");
});

test("13: LoadingState ofrece un botón conectado al reintento", async () => {
  const loading = await inspect(loadingPath);
  assert.ok(loading.hasRetry("button", "onClick", "retry"), "LoadingState debe conectar un botón a la prop onRetry, directamente o mediante un callback que la invoque.");
  const listing = await inspect(listingPath);
  assert.ok(listing.hasRetry("LoadingState", "onRetry", "api"), "El onRetry del listado debe alcanzar una nueva consulta fetch a /api/inspecciones, por referencia de función o callback; un handler vacío no basta.");
});
