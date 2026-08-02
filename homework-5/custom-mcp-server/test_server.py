"""Regression tests for the lorem MCP server.

Run directly (no test dependency needed):

    uv run --directory custom-mcp-server python test_server.py

or with pytest, if it is installed:

    uv run --directory custom-mcp-server pytest test_server.py
"""

import os
import tempfile
from pathlib import Path

import server


def test_source_path_is_anchored_to_the_module() -> None:
    """KAN-14: the path must be derived from the module, never from the cwd."""
    assert server.LOREM_FILE.is_absolute()
    assert server.LOREM_FILE == Path(server.__file__).parent / "lorem-ipsum.md"


def test_reads_from_any_working_directory() -> None:
    """Clients may launch the server from any directory; reads must still work."""
    original = Path.cwd()
    try:
        with tempfile.TemporaryDirectory() as elsewhere:
            os.chdir(elsewhere)
            words = server._read_words().split()
        assert len(words) == server.DEFAULT_WORD_COUNT
    finally:
        os.chdir(original)


if __name__ == "__main__":
    for name in sorted(n for n in dict(globals()) if n.startswith("test_")):
        globals()[name]()
        print(f"ok  {name}")
