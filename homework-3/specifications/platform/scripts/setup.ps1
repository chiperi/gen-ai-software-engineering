# One-time dev setup (Windows / PowerShell).
$ErrorActionPreference = "Stop"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -e ".[dev]"
pre-commit install
Write-Host "setup complete — run 'just check' to verify the quality gates"
