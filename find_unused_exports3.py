#!/usr/bin/env python3
import os, re, sys
from collections import defaultdict

src_dir = 'src'
exclude_dirs = {"node_modules", ".next"}

all_files = []
for root, dirs, files in os.walk(src_dir):
    dirs[:] = [d for d in dirs if d not in exclude_dirs]
    for f in files:
        if (f.endswith(".ts") or f.endswith(".tsx")) and not f.endswith(".d.ts"):
            all_files.append(os.path.join(root, f))

print("Total files: {}.".format(len(all_files)), flush=True)

file_contents = {}
for fp in all_files:
    try:
        with open(fp, "r", encoding="utf-8", errors="replace") as f:
            file_contents[fp] = f.read()
    except Exception:
        file_contents[fp] = ""

export_map = defaultdict(list)

def extract_exports(fp, content):
    results = []
    lines = content.split("
")
    i = 0
    while i < len(lines):
        stripped = lines[i].strip()
        if stripped.startswith("//"):
            i += 1
            continue
        if re.match(r"^export\s+\{", stripped):
            block = [stripped]
            start = i
            i += 1
            while i < len(lines) and "}" not in block[-1]:
                block.append(lines[i].strip())
                i += 1
            merged = " ".join(block)
            inner = re.sub(r"^export\s*\{\s*", "", merged)
            inner = re.sub(r"\s*\}\s*;?\s*$", "", inner)
            for item in [x.strip() for x in inner.split(",") if x.strip()]:
                parts = item.split()
                if parts:
                    results.append((parts[0], fp, start+1, "value"))
            continue
        if re.match(r"^export\s+\*\s+from\s+", stripped):
            i += 1
            continue
        if re.match(r"^export\s+\{[^}]*\}\s+from\s+", stripped):
            i += 1
            continue
        m = re.match(r"^export\s+(?:async\s+)?function\s+(\w+)", stripped)
        if m: results.append((m.group(1), fp, i+1, "value")); i += 1; continue
        m = re.match(r"^export\s+class\s+(\w+)", stripped)
        if m: results.append((m.group(1), fp, i+1, "value")); i += 1; continue
        m = re.match(r"^export\s+enum\s+(\w+)", stripped)
        if m: results.append((m.group(1), fp, i+1, "value")); i += 1; continue
        m = re.match(r"^export\s+type\s+(\w+)", stripped)
        if m: results.append((m.group(1), fp, i+1, "type")); i += 1; continue
        m = re.match(r"^export\s+interface\s+(\w+)", stripped)
        if m: results.append((m.group(1), fp, i+1, "type")); i += 1; continue
        m = re.match(r"^export\s+(?:const|let|var)\s+(\w+)\s*(?::|=)", stripped)
        if m: results.append((m.group(1), fp, i+1, "value")); i += 1; continue
        m = re.match(r"^export\s+default\s+(?:function|class)\s+(\w+)", stripped)
        if m: results.append((m.group(1), fp, i+1, "value")); i += 1; continue
        i += 1
    return results

for fp in all_files:
    content = file_contents.get(fp, "")
    for name, fpath, line, kind in extract_exports(fp, content):
        export_map[name].append((fpath, line, kind))

print("Unique export identifiers: {}.".format(len(export_map)), flush=True)

def is_barrel(fp):
    return os.path.basename(fp) in ("index.ts", "index.tsx")

imported_names = defaultdict(set)
barrel_imported = defaultdict(set)

for fp in all_files:
    content = file_contents.get(fp, "")
    for line in content.split("
"):
        stripped = line.strip()
        if stripped.startswith("import "):
            m = re.search(r"import\s*\{([^}]*)\}\s*from", stripped)
            if m:
                inner = m.group(1)
                for item in [x.strip() for x in inner.split(",") if x.strip()]:
                    parts = item.split()
                    name = parts[0]
                    if is_barrel(fp):
                        barrel_imported[name].add(fp)
                    else:
                        imported_names[name].add(fp)
            m2 = re.match(r"import\s+(\w+)\s+from\s+", stripped)
            if m2:
                name = m2.group(1)
                if is_barrel(fp):
                    barrel_imported[name].add(fp)
                else:
                    imported_names[name].add(fp)
            m3 = re.search(r"\*\s+as\s+(\w+)\s+from\s+", stripped)
            if m3:
                name = m3.group(1)
                if is_barrel(fp):
                    barrel_imported[name].add(fp)
                else:
                    imported_names[name].add(fp)

unused_values = []
unused_types = []

for name, locations in export_map.items():
    defining_files = set(loc[0] for loc in locations)
    direct_importers = imported_names.get(name, set()) - defining_files
    if direct_importers:
        continue
    barrel_importers = barrel_imported.get(name, set()) - defining_files
    if not barrel_importers:
        kinds = set(loc[2] for loc in locations)
        entry = (name, [(loc[0], loc[1]) for loc in locations])
        if "type" in kinds:
            unused_types.append(entry)
        else:
            unused_values.append(entry)
        continue
    found = False
    for fp in all_files:
        if fp in defining_files or is_barrel(fp):
            continue
        content = file_contents.get(fp, "")
        for line in content.split("
"):
            s = line.strip()
            if s.startswith("import "):
                continue
            if re.search(r"(?<![\w$])" + re.escape(name) + r"(?![\w$])", s):
                found = True
                break
        if found:
            break
    if not found:
        kinds = set(loc[2] for loc in locations)
        entry = (name, [(loc[0], loc[1]) for loc in locations])
        if "type" in kinds:
            unused_types.append(entry)
        else:
            unused_values.append(entry)

print("
" + "="*80)
print("RESULTS: EXPORTS WITH ZERO REFERENCES IN src/")
print("="*80)

unused_values.sort(key=lambda x: (x[1][0][0], x[1][0][1]))
unused_types.sort(key=lambda x: (x[1][0][0], x[1][0][1]))

print("
=== 1. UNUSED EXPORTED FUNCTIONS / VARIABLES ({} found) ===
".format(len(unused_values)))
for name, locs in unused_values:
    for fp, line in locs:
        rel = os.path.relpath(fp, os.getcwd())
        print("  {}:{}  {}".format(rel, line, name))
    print()

print("
=== 2. UNUSED EXPORTED TYPES / INTERFACES ({} found) ===
".format(len(unused_types)))
for name, locs in unused_types:
    for fp, line in locs:
        rel = os.path.relpath(fp, os.getcwd())
        print("  {}:{}  {}".format(rel, line, name))
    print()
