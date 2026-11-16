# Records every line listed in .voices/jobs.json with the Kokoro speech model (Apache 2.0).
#   node scripts/voice-jobs.mjs
#   .venv/Scripts/python scripts/make-voices.py [--force]
#   node scripts/voice-jobs.mjs --manifest
#   .venv/Scripts/python scripts/audit-voices.py
# Clips that already exist are skipped, so after adding content only the new lines are recorded.
import itertools
import json
import os
import re
import sys

import jaconv
from misaki import ja

RUBY = re.compile(r'\{([^|{}]+)\|([^|{}]+)\}')
g2p = ja.JAG2P()

# ---- Japanese: make the voice say what the lesson writes --------------------------------------
# The speech model reads kanji with a dictionary, which sometimes picks another reading than the
# lesson's furigana (明日 as あす instead of あした). For every line we work out the sounds the lesson
# writes, then find a spelling of the line (kanji, or kana for the words that go wrong) that the
# model pronounces exactly that way.

# Spelling habits that are the same sound: long vowels, and ん taking the shape of what follows.
SAME = [('ei', 'eː'), ('oɯ', 'oː'), ('oo', 'oː'), ('ii', 'iː'), ('aa', 'aː'), ('ee', 'eː'), ('ɯɯ', 'ɯː'), ('ɨɯ', 'ɨː'), ('ːː', 'ː')]
NASAL = re.compile(r'[ɴŋɲmn](?![aiɯeoɨʲ])')


def norm(phonemes):
    s = re.sub(r'[^a-zɐ-ʯβçŋʔːᵝ]', '', phonemes)
    for a, b in SAME:
        s = s.replace(a, b)
    return NASAL.sub('n', s)


def sounds(text):
    """The sounds the speech model will produce for this text."""
    return norm(g2p(text)[0])


SMALL = 'ァィゥェォャュョヮ'
FIXED = {'ー': 'ː', 'ッ': 'ʔ', 'ン': 'ɴ', 'ヲ': 'o', 'ハ': 'ha', 'ヘ': 'he'}
_mora = {}


def mora_sound(m):
    if m in FIXED:
        return FIXED[m]
    if m not in _mora:
        _mora[m] = re.sub(r'\s', '', g2p(m)[0])
    return _mora[m]


def expected_sounds(marked):
    """The sounds the lesson writes: its kana reading, syllable by syllable, no dictionary involved."""
    said = {'wa': 'ワ', 'e': 'エ', 'o': 'オ'}
    kana = RUBY.sub(lambda m: said.get(m.group(2), m.group(1)) if m.group(2).isascii() else m.group(2), marked)
    kata = re.sub(r'[^ァ-ヺー]', '', jaconv.hira2kata(kana))
    out, i = '', 0
    while i < len(kata):
        m = kata[i]
        i += 1
        while i < len(kata) and kata[i] in SMALL:
            m += kata[i]
            i += 1
        out += mora_sound(m)
    return norm(out)


def choose_text(marked):
    """Returns (text to give the voice, whether its sounds match the lesson)."""
    want = expected_sounds(marked)
    segs = [m for m in RUBY.finditer(marked) if not m.group(2).isascii()]

    def build(choice):
        it = iter(choice)

        def one(m):
            if m.group(2).isascii():
                return m.group(1)
            c = next(it)
            return m.group(1) if c == 0 else jaconv.hira2kata(m.group(2)) if c == 1 else m.group(2)
        return re.sub(r'\s+', ' ', RUBY.sub(one, marked).replace('___', ' ')).strip()

    n = len(segs)
    if n <= 6:
        options = sorted(itertools.product((0, 1, 2), repeat=n), key=lambda c: (sum(1 for x in c if x), c))
    else:
        options = [(0,) * n, (1,) * n, (2,) * n]
    for choice in options:
        text = build(choice)
        if sounds(text) == want:
            return text, True
    return build((0,) * n), False


# ---- recording --------------------------------------------------------------------------------
if __name__ == '__main__':
    import numpy as np
    import soundfile as sf
    from kokoro import KPipeline

    OUT = 'public/audio'
    RATE = 24000
    SPEED = 0.95
    FORCE = '--force' in sys.argv
    os.makedirs(OUT, exist_ok=True)
    jobs = json.load(open('.voices/jobs.json', encoding='utf-8'))
    # What each existing Japanese clip was recorded from, so a clip is redone if a better spelling is found.
    SAID = '.voices/said.json'
    said_before = json.load(open(SAID, encoding='utf-8')) if os.path.exists(SAID) else {}

    def trim(audio, pad=0.06):
        """Cut the silence before and after the voice, leaving a short margin."""
        loud = np.flatnonzero(np.abs(audio) > 0.01)
        if not len(loud):
            return audio
        m = int(RATE * pad)
        return audio[max(0, loud[0] - m): loud[-1] + m]

    report, pipes, done = [], {}, 0
    for job in jobs:
        path = os.path.join(OUT, job['id'] + '.mp3')
        lang = 'j' if job['lang'] == 'ja' else 'i'
        text = job['text']
        if lang == 'j':
            text, ok = choose_text(job['marked'])
            if not ok:
                report.append(f"MISMATCH {job['text']}  audio [{sounds(text)}]  written [{expected_sounds(job['marked'])}]")
            elif text != job['text']:
                report.append(f"READING  {job['text']}  said as: {text}")
        if os.path.exists(path) and not FORCE and (lang != 'j' or said_before.get(job['id']) == text):
            continue
        if lang not in pipes:
            pipes[lang] = KPipeline(lang_code=lang, repo_id='hexgrad/Kokoro-82M')
        parts, phonemes = [], ''
        for _, ps, audio in pipes[lang](text, voice=job['voice'], speed=SPEED):
            parts.append(np.asarray(audio, dtype=np.float32))
            phonemes += ps
        if not parts:
            report.append(f"EMPTY    {job['text']}")
            continue
        audio = trim(np.concatenate(parts))
        secs = len(audio) / RATE
        per = secs / max(1, len(phonemes))
        if '❓' in phonemes or per > 0.22 or per < 0.04 or secs < 0.25:
            report.append(f"CHECK    {job['voice']}  {job['text']}  [{phonemes}]  {secs:.2f}s")
        sf.write(path, audio, RATE, format='MP3')
        if lang == 'j':
            said_before[job['id']] = text
        done += 1
        if done % 25 == 0:
            print(done, 'recorded', flush=True)

    json.dump(said_before, open(SAID, 'w', encoding='utf-8'), ensure_ascii=False)
    open('.voices/report.txt', 'w', encoding='utf-8').write('\n'.join(report) + '\n')
    print(f'{done} new clips, {len(report)} lines to look at in .voices/report.txt')
