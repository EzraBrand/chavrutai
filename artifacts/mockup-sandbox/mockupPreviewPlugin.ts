import type { Plugin } from "vite";
import fg from "fast-glob";
import fs from "node:fs";
import path from "node:path";

const MOCKUPS_DIR = "src/components/mockups";
const GENERATED_FILE = "src/.generated/mockup-components.ts";

function getComponentEntries(): { folder: string; name: string; file: string }[] {
  const files = fg.sync(`${MOCKUPS_DIR}/**/*.tsx`, { ignore: ["**/_*"] });
  return files.map((file) => {
    const rel = path.relative(MOCKUPS_DIR, file);
    const parts = rel.replace(/\.tsx$/, "").split(path.sep);
    if (parts.length === 1) {
      return { folder: "", name: parts[0], file };
    }
    const folder = parts.slice(0, -1).join("/");
    const name = parts[parts.length - 1];
    return { folder, name, file };
  });
}

function generateRegistry(entries: { folder: string; name: string; file: string }[]): string {
  const imports = entries
    .map(
      (e, i) =>
        `import { ${e.name} as C${i} } from "../../${e.file.replace(/\.tsx$/, "")}";`
    )
    .join("\n");

  const records = entries
    .map(
      (e, i) =>
        `  { folder: ${JSON.stringify(e.folder)}, name: ${JSON.stringify(e.name)}, component: C${i} }`
    )
    .join(",\n");

  return `// AUTO-GENERATED — do not edit\nimport type React from "react";\n${imports}\n\nexport const mockupComponents: { folder: string; name: string; component: React.ComponentType }[] = [\n${records}\n];\n`;
}

function writeRegistry() {
  const entries = getComponentEntries();
  const content = generateRegistry(entries);
  fs.mkdirSync(path.dirname(GENERATED_FILE), { recursive: true });
  fs.writeFileSync(GENERATED_FILE, content, "utf-8");
}

export function mockupPreviewPlugin(): Plugin {
  return {
    name: "mockup-preview-plugin",
    configureServer(server) {
      writeRegistry();

      server.watcher.add(path.resolve(MOCKUPS_DIR));
      server.watcher.on("add", (file) => {
        if (file.includes(MOCKUPS_DIR) && file.endsWith(".tsx") && !path.basename(file).startsWith("_")) {
          writeRegistry();
          server.moduleGraph.invalidateAll();
          server.ws.send({ type: "full-reload" });
        }
      });
      server.watcher.on("unlink", (file) => {
        if (file.includes(MOCKUPS_DIR)) {
          writeRegistry();
          server.moduleGraph.invalidateAll();
          server.ws.send({ type: "full-reload" });
        }
      });

      // Rewrite preview paths to the base so Vite serves index.html
      server.middlewares.use((req, _res, next) => {
        if (req.url?.startsWith("/__mockup/preview/")) {
          req.url = "/__mockup/";
        }
        next();
      });
    },
    buildStart() {
      writeRegistry();
    },
  };
}
