#!/usr/bin/env node
import { spawn } from "node:child_process";

import { relative } from "node:path";

const files = process.argv
    .slice(2)
    .map((file) => ({
        original: file,
        relative: relative(process.cwd(), file),
    }))
    .filter(({ relative }) => !relative.startsWith("public/"))
    .map(({ original }) => original);

if (files.length === 0) {
    process.exit(0);
}

const child = spawn(
    "npx",
    ["eslint", "--max-warnings=0", "--fix", ...files],
    {
        stdio: "inherit",
    }
);

child.on("exit", (code) => {
    process.exit(code ?? 1);
});

child.on("error", (error) => {
    console.error(error);
    process.exit(1);
});
