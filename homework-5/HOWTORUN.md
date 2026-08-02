# 🚀 How to run

Setup and testing instructions for the four MCP servers in this homework. See
[README.md](README.md) for what each server does.

## Prerequisites

| Tool | Why | Check |
|------|-----|-------|
| [`uv`](https://docs.astral.sh/uv/) ≥ 0.5 | runs the custom Python server and installs its deps | `uv --version` |
| Python ≥ 3.10 | required by `fastmcp` (`uv` will fetch one if needed) | `python3 --version` |
| Node.js + `npx` | runs the Filesystem and Notion servers | `npx --version` |
| Claude Code | the MCP client | `claude --version` |

All commands below are run from the `homework-5/` directory.

---

## 1. Install dependencies

The custom server's dependencies are declared in
[`custom-mcp-server/pyproject.toml`](custom-mcp-server/pyproject.toml) and pinned in
`uv.lock`:

```bash
uv sync --directory custom-mcp-server
```

This creates `custom-mcp-server/.venv/` and installs `fastmcp` (resolved to **3.4.5**).
Verify:

```bash
uv run --directory custom-mcp-server python -c "import fastmcp; print(fastmcp.__version__)"
# 3.4.5
```

The Filesystem and Notion servers need no install step — `npx -y` fetches them on first
launch.

## 2. Provide credentials

[`.mcp.json`](.mcp.json) references credentials as `${VAR}` placeholders and stores **no
secrets**. Export these in your shell profile (`~/.zshrc`) before starting Claude Code:

| Variable | Used by | Where to get it |
|----------|---------|-----------------|
| `GITHUB_MCP_PAT` | GitHub | GitHub → Settings → Developer settings → Personal access tokens |
| `NOTION_TOKEN` | Notion | Notion → Settings → Connections → your integration |
| `JIRA_URL`, `CONFLUENCE_URL` | Atlassian | e.g. `https://your-site.atlassian.net` |
| `ATLASSIAN_EMAIL` | Atlassian | your Atlassian account email |
| `ATLASSIAN_API_TOKEN` | Atlassian | id.atlassian.com → Security → API tokens |

```bash
export GITHUB_MCP_PAT="ghp_..."
export NOTION_TOKEN="ntn_..."
```

> The Filesystem server needs no credentials. Its allowed root is the last argument in
> `.mcp.json` — `${HOME}/Projects/set_uni_ai`. Change that path to scope it elsewhere;
> the server can only reach files beneath it.

## 3. Run the custom server

Claude Code starts it automatically, but you can launch it by hand to check it boots:

```bash
uv run --directory custom-mcp-server server.py
```

It speaks **stdio** — on success it waits silently for JSON-RPC on standard input and
prints nothing. That silence *is* the success signal; an import error or bad path would
print a traceback instead. Press `Ctrl-C` to stop.

To confirm it actually speaks MCP, send it an `initialize` handshake:

```bash
printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"probe","version":"1"}}}' \
  | uv run --directory custom-mcp-server server.py 2>/dev/null
```

Expected — note `"name":"lorem"`:

```json
{"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2025-06-18", ... ,"serverInfo":{"name":"lorem","version":"3.4.5"}}}
```

## 4. Connect the MCP configuration

[`.mcp.json`](.mcp.json) is **project-scoped**: Claude Code picks it up automatically
when started from this directory.

> The top-level key must be **`mcpServers`**. VS Code's own MCP config uses `servers`
> instead — a file in that shape is still valid JSON, so Claude Code loads it, finds no
> `mcpServers` object, and registers nothing without reporting an error.

```bash
claude
```

On first launch Claude Code asks for approval to use the project's MCP servers — accept
it. Then check registration:

```
/mcp
```

All four servers (`github`, `filesystem`, `notion`/`atlassian`, `lorem`) should be listed
as **connected**. If `lorem` fails, run the handshake from step 3 to see the error —
Claude Code hides the server's stderr.

The custom server's entry is:

```json
"lorem": {
  "command": "uv",
  "args": ["run", "--directory", "custom-mcp-server", "server.py"]
}
```

The `--directory` path is relative to where Claude Code was started, which is why you
must launch it from `homework-5/`.

## 5. Test the `read` tool

### From Claude Code

Ask in the session:

```
Use the lorem MCP server's read tool to give me 10 words.
```

Claude calls `read` with `{"word_count": 10}` and returns exactly ten words. Omit the
number and it uses the default of 30. You can also read the resource directly by URI —
`lorem://text` or `lorem://text/7`.

### From the command line, over a real stdio subprocess

This launches `server.py` as a separate process and talks MCP to it — the same path
Claude Code uses:

```bash
uv run --directory custom-mcp-server python -c '
import asyncio
from fastmcp import Client

async def main():
    async with Client("server.py") as c:
        print("tools:  ", [t.name for t in await c.list_tools()])
        print("read(4):", (await c.call_tool("read", {"word_count": 4})).data)

asyncio.run(main())
'
```

Expected (after FastMCP’s startup banner on stderr):

```
tools:   ['read']
read(4): # Lorem Ipsum Lorem
```

> Don’t try to drive a multi-message session by piping `printf` into the server. The
> pipe closes stdin immediately, and the server shuts down on EOF before it reaches your
> second request — the one-shot handshake in step 3 works, but a follow-up `tools/call`
> in the same pipe silently returns nothing.

### With an in-memory client (most thorough)

FastMCP can connect to the server object directly, with no subprocess:

```bash
uv run --directory custom-mcp-server python -c '
import asyncio, sys
sys.path.insert(0, ".")
from fastmcp import Client
from server import mcp

async def main():
    async with Client(mcp) as c:
        print("tools:    ", [t.name for t in await c.list_tools()])
        print("resources:", [str(r.uri) for r in await c.list_resources()])
        print("templates:", [t.uriTemplate for t in await c.list_resource_templates()])
        print("lorem://text   ->", (await c.read_resource("lorem://text"))[0].text)
        print("lorem://text/7 ->", (await c.read_resource("lorem://text/7"))[0].text)
        print("read(5)        ->", (await c.call_tool("read", {"word_count": 5})).data)

asyncio.run(main())
'
```

Expected: `read(5)` returns 5 words, `lorem://text/7` returns 7, and `lorem://text`
returns 30.

## 6. Exercise the other three servers

Prompts that produce the results captured in [`docs/screenshots/`](docs/screenshots/):

| Server | Prompt |
|--------|--------|
| GitHub | *"List the last 5 pull requests in this repository."* |
| Filesystem | *"List the files in `~/Projects/set_uni_ai/HW` and summarize the structure."* |
| Notion / Jira | *"Give me the tickets/pages of the last 5 bugs on the project."* |
| Custom | *"Use the lorem read tool to give me 10 words."* |

> ⚠️ When capturing the bug-ticket response, show **ticket/page numbers only** — crop or
> redact titles, assignees, and descriptions.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `/mcp` lists no project servers at all, and no error is shown | `.mcp.json` written in VS Code format — top-level key `servers` instead of `mcpServers` | rename the key to `mcpServers` and restart Claude Code |
| `lorem` shows as failed in `/mcp` | Claude Code started outside `homework-5/` | restart `claude` from this directory |
| `No such file or directory: server.py` | same as above — `--directory` is relative | as above |
| `ModuleNotFoundError: fastmcp` | deps not installed | `uv sync --directory custom-mcp-server` |
| `Source file not found: .../lorem-ipsum.md` | file deleted or renamed | restore `custom-mcp-server/lorem-ipsum.md` |
| `word_count must be a positive integer` | asked for 0 or fewer words | pass a value ≥ 1 — this error is intentional |
| GitHub/Notion/Jira server unauthorized | env var unset or token expired | re-export the variable (step 2), then restart Claude Code |
| Env var changes have no effect | Claude Code resolves `${VAR}` at launch | fully restart Claude Code, not just `/mcp` |
