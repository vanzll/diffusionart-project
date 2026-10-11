"""Rasterize published panels without changing plotted data or annotations."""
import argparse
import hashlib
import json
import shutil
import subprocess
import tempfile
from pathlib import Path

from PIL import Image


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--release', required=True, type=Path)
    parser.add_argument('--cover-audit', required=True, type=Path)
    args = parser.parse_args()
    assets = Path(__file__).resolve().parents[1] / 'docs/assets'
    figures = args.release / 'source/Figures'
    panels = [
        ('fig2_legend_review_20261008.pdf', 'consistency-force.webp', (.51, 0, 1, 1)),
        ('fig3_review_20261008_v2.pdf', 'ema-restoration.webp', (.299, .115, .555, .89)),
        ('DiffusionART_method_overview_time_fixed_20260928.pdf', 'aggregation-first.webp', (0, 0, 1, 1)),
        ('DiffusionART_method_overview_time_fixed_20260928.pdf', 'aggregation-force.webp', (0, 0, .495, 1)),
        ('DiffusionART_method_overview_time_fixed_20260928.pdf', 'aggregation-states.webp', (.5, 0, 1, 1)),
        ('diffusionart_cover_base_model_20261008.pdf', 'video-efficiency.webp', (0, 0, .387, 1)),
    ]
    records = []
    with tempfile.TemporaryDirectory() as temporary:
        for index, (name, output, crop) in enumerate(panels):
            source = figures / name
            prefix = Path(temporary) / str(index)
            subprocess.run(['pdftoppm', '-scale-to', '2200', '-singlefile', '-png',
                            str(source), str(prefix)], check=True, timeout=30)
            image = Image.open(prefix.with_suffix('.png')).convert('RGB')
            rectangle = tuple(round(v * image.size[i % 2]) for i, v in enumerate(crop))
            image = image.crop(rectangle)
            target = assets / output
            image.save(target, format='WEBP', lossless=True)
            records.append({'asset': output, 'sha256': sha256(target), 'source': name,
                            'source_sha256': sha256(source), 'crop_fraction': crop,
                            'width': image.width, 'height': image.height})
    for source, target in [(args.release / 'DiffusionART-arxiv.pdf', 'DiffusionART-paper.pdf'),
                           (args.cover_audit / 'cover_curves.csv', 'cover-curves.csv'),
                           (args.cover_audit / 'cover_manifest.json', 'cover-audit.json')]:
        shutil.copyfile(source, assets / target)
        records.append({'asset': target, 'sha256': sha256(assets / target),
                        'source': source.name, 'source_sha256': sha256(source)})
    provenance = {'source_release': 'Author arXiv release, 2026-10-09',
                  'conversion': 'Published PDFs rasterized at longest side 2200px; named panels cropped; lossless WebP; no curve or content edits.',
                  'files': records}
    (assets / 'research-provenance.json').write_text(json.dumps(provenance, indent=2) + '\n')
    print(json.dumps(records, indent=2))


if __name__ == '__main__':
    main()
