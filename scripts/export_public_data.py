#!/usr/bin/env python3
"""把 battle-power/merged.json (+ annotations.json) 导出为站点公开数据。

发布到 GitHub Pages 的是**派生统计**，因此这里做三层剥离：

1. **不含原文**：删掉所有引文字段（`evidence` / `ending_evidence` / `tier_reason` / `kill_list`）。
2. **不含作者昵称**：删掉 `work_author`（页面只显示作品名）。
3. **只保留**：角色名、等级、分值、结局、击杀计数、量级标签、以及我们自己写的吐槽。

用法：
    python3 scripts/export_public_data.py            # 读 ../battle-power/merged.json
    python3 scripts/export_public_data.py --strict   # 有校验问题就退出码 1
"""
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent
BP = SITE.parent / "battle-power"
OUT = SITE / "public" / "data" / "ranking.json"

CHAR_KEEP = (
    "uid", "name", "aliases", "role", "kind", "power_tier", "power_score",
    "ending", "kills_direct", "kills_indirect", "aoe_level",
    "kill_estimate", "kill_estimate_label", "kill_estimate_range",
    "kill_estimate_basis", "kill_estimate_confidence",
    "self_kill", "consented", "conceptual_death", "uncertain",
    "note", "work_id", "work_rank", "work_title", "categories",
)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--strict", action="store_true")
    args = ap.parse_args()

    merged = json.loads((BP / "merged.json").read_text(encoding="utf-8"))
    anno_path = BP / "annotations.json"
    anno = json.loads(anno_path.read_text(encoding="utf-8")) if anno_path.exists() else {}

    characters = []
    for c in merged.get("characters", []):
        row = {k: c[k] for k in CHAR_KEEP if k in c}
        # 保险：剔除任何疑似引文的长字段
        row.pop("tier_reason", None)
        characters.append(row)

    works = []
    for w in merged.get("works", []):
        dt = w.get("work_death_toll") or {}
        works.append(
            {
                "work_id": w.get("work_id"),
                "work_rank": w.get("work_rank"),
                "work_title": w.get("work_title"),
                "categories": w.get("categories") or [],
                "char_count": w.get("char_count"),
                "death_toll": {
                    "named_deaths": dt.get("named_deaths") or 0,
                    "unnamed_or_group_deaths": dt.get("unnamed_or_group_deaths") or 0,
                    "mass_event_count": len(dt.get("mass_death_events") or []),
                    "total_label": dt.get("total_label") or "无",
                },
                "note": w.get("work_note") or "",
            }
        )

    payload = {
        "generated_at": datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds"),
        "spec_version": merged.get("spec_version"),
        "source_generated_at": merged.get("generated_at"),
        "totals": merged.get("totals", {}),
        "works": works,
        "characters": characters,
        "leaderboards": merged.get("leaderboards", {}),
        "awards": anno.get("awards", []),
        "cross_work": anno.get("cross_work", []),
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    problems = merged.get("problems") or []
    print(f"exported {len(works)} works / {len(characters)} characters -> {OUT}")
    print(f"size: {OUT.stat().st_size / 1024:.1f} KiB")
    if problems:
        print(f"注意：merged.json 里有 {len(problems)} 条校验问题")
        for p in problems[:10]:
            print(f"  - {p}")
    return 1 if (args.strict and problems) else 0


if __name__ == "__main__":
    raise SystemExit(main())
