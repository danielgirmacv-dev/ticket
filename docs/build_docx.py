#!/usr/bin/env python3
"""Build Word volumes from Markdown using pandoc."""

from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent

TECH = [
    ROOT / "technical" / name
    for name in [
        "01-System-Overview.md",
        "02-System-Architecture.md",
        "03-Database-Documentation.md",
        "04-API-Documentation.md",
        "05-Installation-Deployment.md",
        "06-Security-Documentation.md",
        "07-Testing-Documentation.md",
        "08-Maintenance-Troubleshooting.md",
    ]
]
USER = [
    ROOT / "user-manual" / name
    for name in [
        "01-Introduction.md",
        "02-Login-Guide.md",
        "03-Dashboard-Guide.md",
        "04-Feature-Guides.md",
        "05-FAQ.md",
    ]
]


def pandoc() -> str:
    exe = shutil.which("pandoc") or "/usr/bin/pandoc"
    if not Path(exe).exists():
        sys.exit("pandoc is required. Install it, then run: python3 docs/build_docx.py")
    return exe


def build(title: str, dest: Path, sources: list[Path]) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        pandoc(),
        "--from",
        "markdown",
        "--to",
        "docx",
        "--toc",
        "--toc-depth=2",
        "--metadata",
        f"title={title}",
        "--metadata",
        "author=EEC IT",
        "--resource-path",
        f".:{ROOT}:{ROOT / 'user-manual'}:{ROOT / 'technical'}:{ROOT / 'assets'}:{ROOT / 'assets' / 'screenshots'}:{ROOT / 'assets' / 'technical' / 'diagrams' / 'rendered'}",
        "--reference-doc",
        str(ROOT / "reference.docx"),
        "-o",
        str(dest),
        *[str(p) for p in sources],
    ]
    subprocess.run(cmd, check=True)
    print(f"Wrote {dest} ({dest.stat().st_size} bytes)")


def main() -> None:
    out = ROOT / "output"
    build(
        "EEC IT Asset & Ticket Management System — Technical Documentation",
        out / "Technical-Documentation.docx",
        TECH,
    )
    build(
        "EEC IT Asset & Ticket Management System — User Manual",
        out / "User-Manual.docx",
        USER,
    )


if __name__ == "__main__":
    main()
