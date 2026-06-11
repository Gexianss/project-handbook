#!/usr/bin/env node
/* Tiny static server for the Project Handbook. Zero dependencies.
   Usage: node serve.cjs [port]   (default 8787) */
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const rootPrefix = root.endsWith(path.sep) ? root : root + path.sep;
const port = Number(process.argv[2]) || 8787;

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".cjs": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
};

http
  .createServer((req, res) => {
    let urlPath;
    try {
      urlPath = decodeURIComponent(req.url.split("?")[0]);
    } catch {
      res.writeHead(400, { "Content-Type": "text/plain" });
      res.end("400 Bad Request");
      return;
    }
    const filePath = path.normalize(
      path.join(root, urlPath === "/" ? "index.html" : urlPath)
    );
    if (!filePath.startsWith(rootPrefix)) {
      res.writeHead(403, { "Content-Type": "text/plain" });
      res.end("403 Forbidden");
      return;
    }
    fs.readFile(filePath, (err, buf) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404 Not Found: " + urlPath);
        return;
      }
      res.writeHead(200, {
        "Content-Type":
          types[path.extname(filePath).toLowerCase()] || "application/octet-stream",
        "Cache-Control": "no-store",
      });
      res.end(buf);
    });
  })
  .listen(port, () => {
    console.log("Project Handbook -> http://localhost:" + port);
  });
