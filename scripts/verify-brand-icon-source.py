"""Read-only source audit. Usage: python verify-brand-icon-source.py approved.pdf.
Requires Pillow and pypdf in the audit environment; no application dependency.
"""
import hashlib
import io
import json
from pathlib import Path
import sys
from PIL import Image
from pypdf import PdfReader

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / 'public/images/brand-icons/source.json').read_text())
pdf = Path(sys.argv[1])
assert hashlib.sha256(pdf.read_bytes()).hexdigest() == manifest['sourcePdfSha256'], 'Unexpected source PDF'
reader = PdfReader(pdf)
assert len(reader.pages) == 1
assert len(reader.pages[0].images) == 1
original = Image.open(io.BytesIO(reader.pages[0].images[0].data)).convert('RGB')
assert list(original.size) == manifest['sourceImageSize']
assert hashlib.sha256(original.tobytes()).hexdigest() == manifest['sourcePixelSha256']
for icon in manifest['icons']:
    asset = Image.open(root / ('public' + icon['src'])).convert('RGB')
    crop = original.crop(icon['crop'])
    assert asset.size == crop.size
    assert asset.tobytes() == crop.tobytes(), icon['name'] + ' differs from original artwork'
print(json.dumps({'verifiedOriginalPixelCrops': len(manifest['icons']), 'pdfSha256': manifest['sourcePdfSha256']}))
