# screen-skill Agent Instructions

Use this repository as an agent skill package for data-screen generation.

Before generating a data-screen page, read:

```text
screen-skill/SKILL.md
```

Then follow the V2 workflow:

```text
layout/catalog.json
layout/{layout_type}/rule.json
layout/common/*
themes/catalog.json
kit/catalog.json
kit branch catalog.json
concrete meta.json
```

Do not choose visual components from memory. Use the catalogs and `meta.json` files. If no matching component exists, use a CSS fallback and document the fallback in the generated change log.
