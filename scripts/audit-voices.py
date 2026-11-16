# Checks that each Japanese clip is pronounced the way the lesson writes it.
#   .venv/Scripts/python scripts/audit-voices.py
# The reference is built straight from the lesson's kana, syllable by syllable, with no dictionary
# involved (は as "wa" and へ as "e" where the lesson marks them). It is compared with the sounds
# the speech model produces for the text it is given. Differences are printed and fail the check;
# an empty list means text, furigana, romaji and audio agree.
import json
import re
import sys

import jaconv

src = open('scripts/make-voices.py', encoding='utf-8').read().split('# ---- recording')[0]
ns = {}
exec(compile(src, 'make-voices-head', 'exec'), ns)

bad = 0
for job in json.load(open('.voices/jobs.json', encoding='utf-8')):
    if job['lang'] != 'ja':
        continue
    said, ok = ns['choose_text'](job['marked'])
    if not ok:
        bad += 1
        print(f"{job['text']}\n   said as {said}\n   audio   {ns['sounds'](said)}\n   written {ns['expected_sounds'](job['marked'])}")
print(bad, 'lines differ')
sys.exit(1 if bad else 0)
