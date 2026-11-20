import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import db from "./db.js";

const server = new McpServer({
  name: "securespine-mcp",
  version: "1.0.0",
});

// Tool 1: Query today's ergonomic recovery stats and recent milestone events
server.tool(
  "get_spine_stats",
  "Retrieve today's verified spinal decompression breaks, recovery minutes, and recent coding milestones.",
  {},
  async () => {
    const recoveryRow = db
      .prepare(
        "SELECT COUNT(*) as count, COALESCE(SUM(duration_seconds), 0) as totalSeconds FROM recoveries WHERE date(completed_at) = date('now', 'localtime')"
      )
      .get();

    const recentEvents = db
      .prepare("SELECT id, type, reason, created_at FROM events ORDER BY id DESC LIMIT 5")
      .all();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              verifiedBreaksToday: recoveryRow.count,
              decompressionMinutesToday: Math.round(recoveryRow.totalSeconds / 60),
              recentEvents,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tool 2: Trigger a recovery break check from an IDE agent
server.tool(
  "trigger_recovery_break",
  "Log a coding milestone and trigger a spinal decompression break in SecureSpine++.",
  {
    reason: z.string().default("MCP_AGENT_TRIGGER"),
  },
  async ({ reason }) => {
    const info = db
      .prepare("INSERT INTO events (type, reason) VALUES (?, ?)")
      .run("MCP_TRIGGER", reason);

    return {
      content: [
        {
          type: "text",
          text: `Triggered SecureSpine++ recovery break (Event ID #${info.lastInsertRowid}, reason: ${reason}).`,
        },
      ],
    };
  }
);

// Tool 3: List recent completed decompression recoveries
server.tool(
  "list_recent_recoveries",
  "List the most recent verified away-from-desk spinal decompression recoveries.",
  {
    limit: z.number().int().min(1).max(20).default(5),
  },
  async ({ limit }) => {
    const rows = db
      .prepare("SELECT id, reason, duration_seconds, completed_at FROM recoveries ORDER BY id DESC LIMIT ?")
      .all(limit);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(rows, null, 2),
        },
      ],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);