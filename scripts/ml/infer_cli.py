"""Quick CLI: python scripts/ml/infer_cli.py path/to/lesion.jpg"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts" / "ml"))

from serve import infer_pil  # noqa: E402


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python scripts/ml/infer_cli.py <image.jpg>")
        sys.exit(1)
    path = Path(sys.argv[1])
    result = infer_pil(Image.open(path))
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
