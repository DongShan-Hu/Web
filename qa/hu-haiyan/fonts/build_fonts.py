"""Build self-hosted Noto SC fonts from official Google Fonts source files.

Run with the bundled Python. Dependencies are isolated in ./tooling.
Includes only current HTML/JS characters, ASCII, punctuation, and numerals.
Rerun both families whenever visible text is changed.
"""

import argparse
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "tooling"))

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont


def repertoire(site):
    result = set(range(0x20, 0x7F))
    result.update(range(0x2000, 0x2070))
    result.update(range(0x3000, 0x3040))
    result.update(map(ord, "零〇一二三四五六七八九十百千万亿壹贰叁肆伍陆柒捌玖拾佰仟萬億两兩廿卅（）［］｛｝，。；：？！％／－＋＝"))
    for name in ("index.html", "app.js"):
        text = (site / name).read_text(encoding="utf-8")
        result.update(map(ord, html.unescape(text)))
        result.update(int(value, 16) for value in re.findall(r"\\u([0-9a-fA-F]{4})", text))
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("family", choices=("serif", "sans"))
    args = parser.parse_args()
    site = ROOT.parents[2] / "public" / "sites" / "hu-haiyan"
    family = "NotoSerifSC" if args.family == "serif" else "NotoSansSC"
    output = "display-serif.woff2" if args.family == "serif" else "body-sans.woff2"
    font = TTFont(ROOT / f"{family}-variable.ttf")
    requested = repertoire(site)
    available = set(font.getBestCmap())
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.name_legacy = True
    options.name_languages = ["*"]
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(unicodes=requested)
    subsetter.subset(font)
    font = instantiateVariableFont(font, {"wght": (400, 500)}, inplace=True)
    font.flavor = "woff2"
    target = site / "assets" / "fonts" / output
    font.save(target)
    verified = TTFont(target)
    retained = set(verified.getBestCmap())
    missing = (requested & available) - retained
    if missing:
        raise RuntimeError(f"Subset lost source-supported characters: {sorted(missing)}")
    axes = [{"tag": a.axisTag, "min": a.minValue, "default": a.defaultValue, "max": a.maxValue} for a in verified["fvar"].axes]
    report = {
        "file": str(target),
        "bytes": target.stat().st_size,
        "unicode_characters": len(verified.getBestCmap()),
        "axes": axes,
        "requested_characters_not_in_source": len(requested - available),
        "missing_source_supported_characters": len(missing),
        "missing_cjk_characters": len({cp for cp in requested - retained if 0x3400 <= cp <= 0x9FFF}),
        "family": verified["name"].getDebugName(1),
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
