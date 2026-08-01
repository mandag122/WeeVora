import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

/**
 * Vercel compiles the api/ handlers file by file rather than bundling them, because the project is
 * ESM ("type": "module" in package.json). Extensionless relative specifiers survive into the
 * output, and Node's ESM resolver refuses them:
 *
 *   Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/var/task/api/_lib/airtable'
 *
 * That kills the function at import time, which reaches the browser as FUNCTION_INVOCATION_FAILED.
 * Nothing local catches it - tsc resolves the specifier fine, tsx resolves it fine, and the dev
 * server never loads the compiled output - so this test is the guard.
 */
const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const RELATIVE_IMPORT = /(?:from\s*|import\s*\(\s*|typeof import\s*\(\s*)["'](\.[^"']*)["']/g;

function collectTsFiles(dir: string): string[] {
  return readdirSync(join(projectRoot, dir), { withFileTypes: true }).flatMap((entry) => {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) return collectTsFiles(path);
    return entry.name.endsWith(".ts") ? [path] : [];
  });
}

test("relative imports in api/ and server/ carry an explicit extension", () => {
  const offenders: string[] = [];

  for (const file of [...collectTsFiles("api"), ...collectTsFiles("server")]) {
    const source = readFileSync(join(projectRoot, file), "utf-8");
    for (const [, specifier] of source.matchAll(RELATIVE_IMPORT)) {
      if (!specifier.endsWith(".js") && !specifier.endsWith(".ts") && !specifier.endsWith(".json")) {
        offenders.push(`${file}: "${specifier}"`);
      }
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `Relative imports must end in .js so Node's ESM resolver can find them once Vercel compiles ` +
      `each file:\n  ${offenders.join("\n  ")}`,
  );
});
