# Licences and credits

## Pontino's own work

All lesson text, vocabulary decks, jokes, the Pontino mascot, character portraits, scene illustrations and sound effects are original to this project. Sound effects are synthesised in the browser.

## Photos

Photos of real signs come from Wikimedia Commons. Each is used under the licence shown, resized and cropped, with credit here, on the card and on the in-app Credits screen.

The CC BY-SA licences are share-alike: these photo files, including the cropped versions in `public/photos/`, stay under their original CC BY-SA licence. That obligation applies to the photos, not to the rest of the app.

| Card | Photo | Author | Licence |
|---|---|---|---|
| ja-deck-signs.01 | [地下鉄入口。 (6980636946).jpg](https://commons.wikimedia.org/wiki/File:%E5%9C%B0%E4%B8%8B%E9%89%84%E5%85%A5%E5%8F%A3%E3%80%82_(6980636946).jpg) | se7en from Tokyo, JAPAN | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) |
| ja-deck-signs.03 | [Keikyu-railway-KK09-Omorimachi-station-sign-20150129.jpg](https://commons.wikimedia.org/wiki/File:Keikyu-railway-KK09-Omorimachi-station-sign-20150129.jpg) | LERK | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| ja-deck-signs.04 | [クレージーヒューストン お手洗い (2556080668).jpg](https://commons.wikimedia.org/wiki/File:%E3%82%AF%E3%83%AC%E3%83%BC%E3%82%B8%E3%83%BC%E3%83%92%E3%83%A5%E3%83%BC%E3%82%B9%E3%83%88%E3%83%B3_%E3%81%8A%E6%89%8B%E6%B4%97%E3%81%84_(2556080668).jpg) | Kuruman | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) |
| ja-deck-signs.07 | [一生懸命 営業中 (9716384332).jpg](https://commons.wikimedia.org/wiki/File:%E4%B8%80%E7%94%9F%E6%87%B8%E5%91%BD_%E5%96%B6%E6%A5%AD%E4%B8%AD_(9716384332).jpg) | 旻津 吳 | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0) |
| ja-deck-signs.08 | [終わったョ 準備中 (3780276958).jpg](https://commons.wikimedia.org/wiki/File:%E7%B5%82%E3%82%8F%E3%81%A3%E3%81%9F%E3%83%A7_%E6%BA%96%E5%82%99%E4%B8%AD_(3780276958).jpg) | Bernat Agullo from Tokyo, Japan | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0) |
| ja-deck-signs.11 | [鈴木町駅 改札口.jpg](https://commons.wikimedia.org/wiki/File:%E9%88%B4%E6%9C%A8%E7%94%BA%E9%A7%85_%E6%94%B9%E6%9C%AD%E5%8F%A3.jpg) | よしひろ0909 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| ja-deck-signs.12 | [新幹線・JR線きっぷうりば (43780414550).jpg](https://commons.wikimedia.org/wiki/File:%E6%96%B0%E5%B9%B9%E7%B7%9A%E3%83%BBJR%E7%B7%9A%E3%81%8D%E3%81%A3%E3%81%B7%E3%81%86%E3%82%8A%E3%81%B0_(43780414550).jpg) | keyaki from Yokohama-shi, Kanagawa-ken, Japan | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0) |
| ja-deck-signs.13 | [GPA外貨両替専門店 (44883301674).jpg](https://commons.wikimedia.org/wiki/File:GPA%E5%A4%96%E8%B2%A8%E4%B8%A1%E6%9B%BF%E5%B0%82%E9%96%80%E5%BA%97_(44883301674).jpg) | Michael Ocampo from United States | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) |
| ja-deck-signs.16 | [No entry sign 立入禁止.jpg](https://commons.wikimedia.org/wiki/File:No_entry_sign_%E7%AB%8B%E5%85%A5%E7%A6%81%E6%AD%A2.jpg) | 運動会プロテインパワー | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| ja-deck-signs.17 | [薬局受付 (3137440565).jpg](https://commons.wikimedia.org/wiki/File:%E8%96%AC%E5%B1%80%E5%8F%97%E4%BB%98_(3137440565).jpg) | Osamu Iwasaki from Tokyo, Japan | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0) |

To add photos: `node scripts/find-photos.mjs <folder>` searches Commons and keeps only CC0, public-domain, CC BY and CC BY-SA files; look at the contact sheet, then list the chosen ones in `scripts/add-photos.mjs`. `npm test` fails if a photo has no credit.

## Voices

The clips in `public/audio/` are generated with [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) by hexgrad, an open speech model whose weights are under the Apache 2.0 licence. Its model card states it was trained only on permissive or non-copyrighted audio. The clips are synthetic speech, not recordings of people.

| Voice | Used for | Note from the model's voice list |
|---|---|---|
| jf_alpha | Japanese narrator, 中村 | |
| jf_tebukuro | 佐藤 | CC BY source: [Koniwa, tebukurowokaini](https://github.com/koniwa/koniwa/blob/master/source/tnc/tnc__tebukurowokaini.txt) |
| jm_kumo | レオ | CC BY source: [Koniwa, kumonoito](https://github.com/koniwa/koniwa/blob/master/source/tnc/tnc__kumonoito.txt) |
| if_sara | Italian narrator, Giulia, Sara | |
| im_nicola | Marco, Leo | |

Generation tools, used on the author's computer only and not shipped: kokoro and misaki (Apache 2.0), PyTorch (BSD-3-Clause), espeak-ng (GPL-3.0, for Italian pronunciation), fugashi (MIT) with UniDic (BSD / LGPL / GPL, user's choice), libsndfile (LGPL).

To record new lines after adding content: `node scripts/voice-jobs.mjs`, then `.venv/Scripts/python scripts/make-voices.py`, then `node scripts/voice-jobs.mjs --manifest`, then `.venv/Scripts/python scripts/audit-voices.py`, which fails if any Japanese clip would sound different from its written reading. `npm test` fails if a line has no clip.

## Software

| Package | Use | Licence |
|---|---|---|
| Svelte, Vite, vite-plugin-pwa (Workbox) | App framework, build, offline | MIT |
| Dexie | Storage | Apache-2.0 |
| ts-fsrs | Spaced-repetition scheduling | MIT |
| Zod | Content validation | MIT |
| wanakana | Kana to romaji | MIT |
| Nunito (via Fontsource) | Font | SIL Open Font License 1.1 |
| sharp, Playwright, Vitest, TypeScript | Development only | Apache-2.0 / MIT |

Emoji are drawn by the device's own font and are not bundled.
