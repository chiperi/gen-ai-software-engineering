# mcp/

MCP servers = external **tools** and context for the agent (DB, API, files, search…).
The project config is deployed to the repo root as `.mcp.json`. These are "tools" in the sense of
capabilities — not to be confused with the `tools:` field in subagents (which lists the allowed
built-in tools).
