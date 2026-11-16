# Makes a few sample recordings with the Kokoro speech model, to judge the voices by ear.
#   .venv/Scripts/python scripts/voice-samples.py
# Output goes to voice-samples/ (not committed).
import os
import numpy as np
import soundfile as sf
from kokoro import KPipeline

OUT = 'voice-samples'
os.makedirs(OUT, exist_ok=True)

JA = [
    'はじめまして。中村です。よろしくお願いします。',
    'すみません、駅はどこですか。',
    'コーヒーを一つください。',
]
IT = [
    "Ciao! Cos'hai fatto ieri sera?",
    'Sono andato allo stadio con Marco. La partita è stata bellissima!',
    'Vorrei un caffè e un cornetto, per favore.',
]
SETS = [
    ('j', ['jf_alpha', 'jf_gongitsune', 'jf_tebukuro', 'jm_kumo'], JA),
    ('i', ['if_sara', 'im_nicola'], IT),
]

for lang, voices, lines in SETS:
    pipe = KPipeline(lang_code=lang, repo_id='hexgrad/Kokoro-82M')
    gap = np.zeros(int(24000 * 0.5), dtype=np.float32)
    for voice in voices:
        parts = []
        for line in lines:
            for _, phonemes, audio in pipe(line, voice=voice, speed=0.95):
                print(voice, phonemes)
                parts += [np.asarray(audio, dtype=np.float32), gap]
        path = os.path.join(OUT, f'{voice}.mp3')
        sf.write(path, np.concatenate(parts), 24000, format='MP3')
        print('wrote', path, os.path.getsize(path), 'bytes')
