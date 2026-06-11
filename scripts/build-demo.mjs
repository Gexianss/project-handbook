/* Copies the skill template into examples/demo (preserving demo/data/). */
import { cpSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repo = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const template = path.join(repo, "skills", "project-handbook", "template");
const demo = path.join(repo, "examples", "demo");

mkdirSync(path.join(demo, "data"), { recursive: true });
cpSync(template, demo, { recursive: true });
console.log("Demo assembled at", demo);
