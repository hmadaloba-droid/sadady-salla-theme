import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const themeRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const requiredFiles = [
  "README.md",
  "package.json",
  "theme-config-contract.md",
  "theme-config.example.json",
  "twilight.json",
  "assets/js/sadady/theme-api.js",
  "assets/js/sadady/api-client.js",
  "assets/js/sadady/live-home.js",
  "assets/js/sadady/checkout-flow.js",
  "assets/js/sadady/tracking.js",
  "assets/js/sadady/thank-you.js",
  "src/views/layouts/master.twig",
  "src/views/layouts/landing.twig",
  "src/views/pages/index.twig",
  "src/views/pages/tracking.twig",
  "src/views/pages/thank-you.twig",
  "src/views/components/sadady/journey/summary-modal.twig",
  "PRODUCTION_RUNBOOK.md",
];

const requiredSnippets = [
  {
    file: "src/views/layouts/master.twig",
    snippets: ["window.SADADY_SALLA_CUSTOMER", "window.SADADY_DEBUG_CUSTOMER", "js/sadady/theme-api.js", "js/sadady/session-strip.js"],
  },
  {
    file: "src/views/pages/index.twig",
    snippets: ["js/sadady/quote-flow.js", "js/sadady/checkout-flow.js"],
  },
  {
    file: "src/views/pages/tracking.twig",
    snippets: ["js/sadady/tracking.js"],
  },
  {
    file: "src/views/pages/thank-you.twig",
    snippets: ["js/sadady/thank-you.js"],
  },
  {
    file: "assets/js/sadady/theme-api.js",
    snippets: ["window.SADADY_API_BASE", "window.SADADY_THEME_STATE", "document.documentElement.dataset.sadadyThemeReady"],
  },
  {
    file: "assets/js/sadady/api-client.js",
    snippets: ["window.SADADY_API_BASE", "X-Sadady-Customer-Id", "api/v1/public/quotes/calculate", "api/v1/public/orders/precreate"],
  },
  {
    file: "assets/js/sadady/session-strip.js",
    snippets: ["getSessionSummary", "sadady:auth-success"],
  },
];

const failures = [];

function checkFile(relPath) {
  const fullPath = resolve(themeRoot, relPath);
  if (!existsSync(fullPath)) {
    failures.push(`Missing file: ${relPath}`);
  }
}

function checkSnippets({ file, snippets }) {
  const fullPath = resolve(themeRoot, file);
  if (!existsSync(fullPath)) {
    failures.push(`Missing file for content check: ${file}`);
    return;
  }
  const content = readFileSync(fullPath, "utf8");
  for (const snippet of snippets) {
    if (!content.includes(snippet)) {
      failures.push(`Missing snippet in ${file}: ${snippet}`);
    }
  }
}

for (const relPath of requiredFiles) {
  checkFile(relPath);
}

for (const check of requiredSnippets) {
  checkSnippets(check);
}

if (failures.length) {
  console.error("Theme validation failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Theme validation passed for ${requiredFiles.length} files and ${requiredSnippets.length} content checks.`);
