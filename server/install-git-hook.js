import fs from "node:fs";
import path from "node:path";

const targetRepo = process.argv[2] || path.resolve("..");
const hookPath = path.join(targetRepo, ".git", "hooks", "post-commit");

if (!fs.existsSync(path.dirname(hookPath))) {
  console.error("No .git/hooks directory found at:", targetRepo);
  console.error("Run 'git init' inside that folder first!");
  process.exit(1);
}

const hookScript = `#!/bin/sh
COMMIT_MSG=$(git log -1 --pretty=%B | tr -d '\\n\\r')
node -e '
  fetch("http://localhost:4000/api/trigger", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "GIT_COMMIT", reason: "Git Commit: " + process.argv[1] })
  }).catch(() => {});
' "$COMMIT_MSG"
`;

fs.writeFileSync(hookPath, hookScript, { mode: 0o755 });
console.log("Installed SecureSpine++ post-commit hook at:", hookPath);