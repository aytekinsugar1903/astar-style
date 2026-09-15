import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const catalogPath = path.join(root, "src", "i18n", "translations.ts");
const catalogSource = fs.readFileSync(catalogPath, "utf8");
const catalogFile = ts.createSourceFile(catalogPath, catalogSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

function objectKeys(variableName) {
  for (const statement of catalogFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== variableName) continue;
      const initializer = declaration.initializer && ts.isSatisfiesExpression(declaration.initializer)
        ? declaration.initializer.expression
        : declaration.initializer;
      if (!initializer || !ts.isObjectLiteralExpression(initializer)) throw new Error(`${variableName} is not an object literal`);
      return new Set(initializer.properties
        .filter(ts.isPropertyAssignment)
        .map((property) => property.name.getText(catalogFile).replace(/^["']|["']$/g, "")));
    }
  }
  throw new Error(`Translation dictionary ${variableName} was not found`);
}

const tr = objectKeys("tr");
const en = objectKeys("en");
const missingInEnglish = [...tr].filter((key) => !en.has(key));
const missingInTurkish = [...en].filter((key) => !tr.has(key));

function filesUnder(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return filesUnder(fullPath);
    return /\.(ts|tsx)$/.test(entry.name) ? [fullPath] : [];
  });
}

const unknownKeys = [];
for (const filePath of filesUnder(path.join(root, "app"))) {
  const source = fs.readFileSync(filePath, "utf8");
  const file = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  function visit(node) {
    if (
      ts.isCallExpression(node)
      && ts.isIdentifier(node.expression)
      && node.expression.text === "t"
      && node.arguments[0]
      && ts.isStringLiteral(node.arguments[0])
      && !tr.has(node.arguments[0].text)
    ) {
      unknownKeys.push(`${path.relative(root, filePath)}: ${node.arguments[0].text}`);
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
}

if (missingInEnglish.length || missingInTurkish.length || unknownKeys.length) {
  if (missingInEnglish.length) console.error("Missing in English:", missingInEnglish.join(", "));
  if (missingInTurkish.length) console.error("Missing in Turkish:", missingInTurkish.join(", "));
  if (unknownKeys.length) console.error("Unknown translation keys:", unknownKeys.join(", "));
  process.exit(1);
}

console.log(`Localization check passed: ${tr.size} keys in Turkish and English.`);
