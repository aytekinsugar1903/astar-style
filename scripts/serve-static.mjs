import { createServer } from "node:http";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? "dist");
const port = Number(process.env.PORT ?? 4173);
const host = "127.0.0.1";
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

function resolveFile(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split("?")[0]).replace(/^\/+/, "");
  const candidate = path.resolve(root, cleanPath);
  if (!candidate.startsWith(root + path.sep) && candidate !== root) return null;

  const choices = [
    candidate,
    path.join(candidate, "index.html"),
    `${candidate}.html`,
    path.join(root, "index.html"),
  ];

  return choices.find((filePath) => {
    try { return fs.statSync(filePath).isFile(); }
    catch { return false; }
  }) ?? null;
}

const server = createServer((request, response) => {
  const filePath = resolveFile(request.url ?? "/");
  if (!filePath) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "Content-Type": mimeTypes[path.extname(filePath)] ?? "application/octet-stream",
    "Cache-Control": "no-store",
  });
  fs.createReadStream(filePath).pipe(response);
});

server.listen(port, host, () => {
  console.log(`WEYRA test server: http://${host}:${port}`);
});

