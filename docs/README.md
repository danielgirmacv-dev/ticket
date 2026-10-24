# EEC IT Asset & Ticket Management — Documentation

**System:** Ethiopian Electric Construction (EEC) IT Asset & Ticket Management System  
**Version:** 1.0  
**Date:** October 2026

This folder is the documentation set. Markdown is the source. Word files are generated under `output/`.

```
docs/
├── technical/
│   ├── 01-System-Overview.md
│   ├── 02-System-Architecture.md
│   ├── 03-Database-Documentation.md
│   ├── 04-API-Documentation.md
│   ├── 05-Installation-Deployment.md
│   ├── 06-Security-Documentation.md
│   ├── 07-Testing-Documentation.md
│   └── 08-Maintenance-Troubleshooting.md
├── user-manual/
│   ├── 01-Introduction.md
│   ├── 02-Login-Guide.md
│   ├── 03-Dashboard-Guide.md
│   ├── 04-Feature-Guides.md
│   └── 05-FAQ.md
├── assets/
│   ├── technical/      diagrams, ER exports
│   └── screenshots/    UI captures for the user manual
└── output/
    ├── Technical-Documentation.docx
    └── User-Manual.docx
```

## Who should read what

| Audience | Start here |
|----------|------------|
| Developers / architects | `technical/01-System-Overview.md` then architecture, database, API |
| DevOps | `technical/05-Installation-Deployment.md` and `08-Maintenance-Troubleshooting.md` |
| Security reviewers | `technical/06-Security-Documentation.md` |
| QA | `technical/07-Testing-Documentation.md` |
| End users | `user-manual/01-Introduction.md` |
| Printed packs | `output/*.docx` |

## Screenshots

Drop PNG/JPEG files into `assets/screenshots/` using the names suggested in the user-manual files. Rebuild the Word output after adding images if you embed them in Markdown.

## Regenerating Word files

From the repository root (requires [Pandoc](https://pandoc.org/)):

```bash
python3 docs/build_docx.py
```

Older numbered files (`01_SRS.md`, `02_SDD.md`, …) remain as working notes. Prefer the `technical/` and `user-manual/` tree for new edits.
