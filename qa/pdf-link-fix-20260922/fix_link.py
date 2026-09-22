from io import BytesIO
from pathlib import Path
import json
import subprocess

from PIL import Image, ImageChops
from pypdf import PdfReader, PdfWriter
from pypdf.generic import NameObject, TextStringObject


ROOT = Path(__file__).resolve().parents[2]
QA = Path(__file__).resolve().parent
PDF = ROOT / 'public/sites/zhang-hong/zhang-hong-resume.pdf'
TARGET = 'https://zhanghong.yiyeying.com/'
POPPLER = Path(r'C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\poppler\Library\bin\pdftoppm.exe')


def links(document):
    found = []
    for page in document.pages:
        for reference in page.get('/Annots', []):
            annotation = reference.get_object()
            action = annotation.get('/A')
            if action and action.get('/S') == '/URI':
                found.append(str(action.get('/URI', '')))
    return found


original = PDF.read_bytes()
before = PdfReader(BytesIO(original))
original_links = links(before)
if len(original_links) != 1 or not original_links[0].startswith('file:///') or not original_links[0].endswith('/index.html'):
    raise RuntimeError('Expected exactly one local portfolio link; no file was changed.')

backup = QA / 'before.pdf'
if backup.exists() and backup.read_bytes() != original:
    raise RuntimeError('Existing backup differs; refusing to overwrite it.')
if not backup.exists():
    backup.write_bytes(original)

writer = PdfWriter()
writer.clone_document_from_reader(before)
changed = 0
for page in writer.pages:
    for reference in page.get('/Annots', []):
        action = reference.get_object().get('/A')
        if action and action.get('/S') == '/URI' and str(action.get('/URI', '')) == original_links[0]:
            action[NameObject('/URI')] = TextStringObject(TARGET)
            changed += 1
if changed != 1:
    raise RuntimeError('Unexpected annotation count; original PDF retained.')

candidate = QA / 'candidate.pdf'
with candidate.open('wb') as stream:
    writer.write(stream)

after = PdfReader(candidate)
assert links(after) == [TARGET]
assert len(after.pages) == len(before.pages) == 1
assert [page.extract_text() for page in after.pages] == [page.extract_text() for page in before.pages]
assert [list(page.mediabox) for page in after.pages] == [list(page.mediabox) for page in before.pages]
assert 'file:///' not in candidate.read_bytes().decode('latin1')

for source, name in ((backup, 'before'), (candidate, 'after')):
    subprocess.run([str(POPPLER), '-r', '120', '-singlefile', '-png', str(source), str(QA / name)], check=True, capture_output=True)

with Image.open(QA / 'before.png').convert('RGB') as old, Image.open(QA / 'after.png').convert('RGB') as new:
    identical_render = old.size == new.size and ImageChops.difference(old, new).getbbox() is None
if not identical_render:
    raise RuntimeError('Rendered appearance changed; original PDF retained for review.')

PDF.write_bytes(candidate.read_bytes())
assert links(PdfReader(PDF)) == [TARGET]
result = {'pages': len(after.pages), 'updated_links': changed, 'destination': TARGET,
          'text_unchanged': True, 'pixel_identical': True, 'local_file_links_remaining': False}
(QA / 'verification.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(result, ensure_ascii=False))
