import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

const server = new McpServer({
  name: "securespine-git-mcp",
  version: "1.0.0",
});

// Tool 1: Check recent commit velocity in a local repo
server.tool(
  "inspect_commit_streak",
  "Inspect recent git commits in a local repository to evaluate coding sprint intensity.",
  {
    repoPath: z.string().default("."),
    limit: z.number().int().min(1).max(15).default(5),
  },
  async ({ repoPath, limit }) => {
    try {
      const log = execSync(`git -C "${repoPath}" log -n ${limit} --pretty=format:"%h | %ar | %s"`, {
        encoding: "utf8",
      });
      return { content: [{ type: "text", text: log || "No commits found." }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Git inspection failed: ${err.message}` }] };
    }
  }
);

// Tool 2: Verify whether the SecureSpine++ post-commit hook is installed
server.tool(
  "check_git_hook_status",
  "Verify whether the SecureSpine++ post-commit ergonomic break hook is installed in a repository.",
  {
    repoPath: z.string().default("."),
  },
  async ({ repoPath }) => {
    const hookFile = path.join(repoPath, ".git", "hooks", "post-commit");
    const installed =
      fs.existsSync(hookFile) &&
      fs.readFileSync(hookFile, "utf8").includes("localhost:4000/api/trigger");
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            { repoPath: path.resolve(repoPath), hookInstalled: installed, hookPath: hookFile },
            null,
            2
          ),
        },
      ],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);