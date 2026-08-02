"""Custom MCP server (Homework 5, Task 4).

Exposes the contents of `lorem-ipsum.md` in two ways:

* **Resource** — `lorem://text` and `lorem://text/{word_count}`, URIs Claude can
  read from directly.
* **Tool** — `read`, an action Claude can call with an optional `word_count`.

Both return the first `word_count` words of the file (default: 30).
"""

from pathlib import Path

from fastmcp import FastMCP

mcp = FastMCP("lorem")

LOREM_FILE = Path(__file__).parent / "lorem-ipsum.md"
DEFAULT_WORD_COUNT = 30


def _read_words(word_count: int = DEFAULT_WORD_COUNT) -> str:
    """Return the first `word_count` whitespace-separated words of the file."""
    # A URI template segment (`lorem://text/7`) is a string at the transport level.
    # Coerce before comparing or slicing: an uncoerced str slips past the `< 1`
    # check with an opaque TypeError instead of the documented message.
    try:
        word_count = int(word_count)
    except (TypeError, ValueError):
        raise ValueError("word_count must be a positive integer") from None

    if word_count < 1:
        raise ValueError("word_count must be a positive integer")

    if not LOREM_FILE.exists():
        raise FileNotFoundError(f"Source file not found: {LOREM_FILE}")

    words = LOREM_FILE.read_text(encoding="utf-8").split()
    return " ".join(words[:word_count])


@mcp.resource("lorem://text")
def lorem_text() -> str:
    """Lorem ipsum text, limited to the default of 30 words."""
    return _read_words()


@mcp.resource("lorem://text/{word_count}")
def lorem_text_limited(word_count: int) -> str:
    """Lorem ipsum text, limited to `word_count` words."""
    return _read_words(word_count)


@mcp.tool
def read(word_count: int = DEFAULT_WORD_COUNT) -> str:
    """Read lorem ipsum text from lorem-ipsum.md.

    Args:
        word_count: How many words to return. Defaults to 30.
    """
    return _read_words(word_count)


if __name__ == "__main__":
    mcp.run()  # stdio transport
