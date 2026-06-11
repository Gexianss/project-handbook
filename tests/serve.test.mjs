import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repo = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const serve = path.join(repo, "skills", "project-handbook", "template", "serve.cjs");

function startServer(port) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [serve, String(port)], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    const timer = setTimeout(() => reject(new Error("server did not start")), 5000);
    child.stdout.once("data", () => { clearTimeout(timer); resolve(child); });
    child.on("error", (err) => { clearTimeout(timer); reject(err); });
  });
}

test("serves an existing file with correct content type", async () => {
  const child = await startServer(8899);
  try {
    const res = await fetch("http://localhost:8899/serve.cjs");
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type"), /text\/javascript/);
  } finally {
    child.kill();
  }
});

test("returns 404 for missing files", async () => {
  const child = await startServer(8898);
  try {
    const res = await fetch("http://localhost:8898/nope.html");
    assert.equal(res.status, 404);
  } finally {
    child.kill();
  }
});

test("blocks path traversal outside template root", async () => {
  const child = await startServer(8897);
  try {
    const res = await fetch("http://localhost:8897/..%2f..%2f..%2f..%2fREADME.md");
    assert.equal(res.status, 403);
  } finally {
    child.kill();
  }
});
