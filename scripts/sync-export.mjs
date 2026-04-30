import fs from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const outDir = path.join(rootDir, "out");
const docsDir = path.join(rootDir, "docs");

await fs.rm(docsDir, { recursive: true, force: true });
await fs.mkdir(docsDir, { recursive: true });
await fs.cp(outDir, docsDir, { recursive: true });
await fs.writeFile(path.join(docsDir, ".nojekyll"), "");