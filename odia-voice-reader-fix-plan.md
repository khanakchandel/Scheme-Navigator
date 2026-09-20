# Odia Voice Reader Fix Plan

## Top-Level Overview

The Odia Voice Reader is not speaking page content on the Home page when the Odia language is selected.
The root cause is **mixed-language DOM content**: many key-value translations in `or.ts` are still in
English (not Odia script), so when `extractPageReadableText()` reads the rendered DOM, it collects
English text. That English text is then sent to `prepareSpeechUtterance()` with `targetLang = 'or-IN'`,
which routes it through the Odia transliteration pipeline — resulting in either silence, skipped chunks,
or mispronounced output, because the selected Odia/Hindi voice cannot speak English-script input.

There are three distinct layers of fixes needed:

1. **Translate missing Odia locale strings** — Several Homepage sections (`faq`, `persona`, `popular`,
   most of `about`) have English strings in `or.ts`. These must be translated to Odia so the DOM
   renders Odia text, which the TTS pipeline can correctly handle.

2. **Fix mixed-script chunk handling in `prepareSpeechUtterance`** — When a text chunk contains
   English words mixed with Odia (e.g. brand names like "SchemeNavigator" embedded in Odia sentences),
   those ASCII words must not be fed unchanged to a Hindi/Bengali voice. A guard is needed that
   detects purely-ASCII (English) chunks and returns them with `speechLang = 'en-IN'` instead of
   routing through the Odia pipeline.

3. **Add missing `Pause`, `Resume`, `Reading...` glossary phrases** — The `GlobalVoiceReader`
   UI calls `tp('Pause')`, `tp('Resume')`, `tp('Reading...')` which are absent from the glossary,
   so they display in English even when Odia is selected. These should be added to `glossary.ts`.

---

## Sub-Tasks

---

### Sub-Task 1 — Translate missing `or.ts` Home page strings

**Status:** `[x] completed`

**Intent:**
Fill in the untranslated English strings in `or.ts` for the sections that appear on the Home page.
When Odia is selected, the DOM will render Odia text so `extractPageReadableText()` returns valid
Odia Unicode which the TTS pipeline can speak correctly.

**Expected Outcomes:**
- FAQ section title, subtitle in Odia
- PersonaShowcase title, subtitle in Odia
- Popular Schemes section title, subtitle, viewAll button in Odia
- `about.*` keys that are still English get Odia translations

**Todo List:**
1. Open `Frontend-Scheme-Navigator-main/src/i18n/locales/or.ts`
2. Replace `'faq.title'` with Odia: `'ସାଧାରଣ ପ୍ରଶ୍ନ'`
3. Replace `'faq.subtitle'` with Odia: `'ସରକାରୀ ଯୋଜନା ଆବିଷ୍କାର ଏବଂ ଆବେଦନ ସମ୍ପର୍କରେ ଆପଣଙ୍କ ସମସ୍ତ ପ୍ରଶ୍ନର ଉତ୍ତର।'`
4. Replace `'persona.title'` with Odia: `'SchemeNavigator କାହା ପାଇଁ?'`
5. Replace `'persona.subtitle'` with Odia: `'ଭାରତର ପ୍ରତ୍ୟେକ ନାଗରିକଙ୍କ ପାଇଁ ଯୋଗ୍ୟତା ଆବିଷ୍କାର।'`
6. Replace `'popular.title'` with Odia: `'ଲୋକପ୍ରିୟ କେନ୍ଦ୍ର ଓ ରାଜ୍ୟ ଯୋଜନା'`
7. Replace `'popular.subtitle'` with Odia: `'କୃଷି, ଶିକ୍ଷା, ଆବାସ ଓ ସାମାଜିକ ସୁରକ୍ଷା ଯୋଜନା ଅନ୍ୱେଷଣ କରନ୍ତୁ।'`
8. Replace `'popular.viewAll'` with Odia: `'ସମସ୍ତ ୩,୫୦୦+ ଯୋଜନା ଦେଖନ୍ତୁ'`
9. Translate remaining English `about.*` keys to Odia

**Relevant Context:**
- File: `Frontend-Scheme-Navigator-main/src/i18n/locales/or.ts`
- Currently-translated keys for reference: lines 144–167 (hero, howItWorks all in Odia)
- English-only keys: lines 2–26 (`about.*`), 134–135 (`faq.*`), 192–196 (`persona.*`, `popular.*`)

---

### Sub-Task 2 — Fix mixed-script chunk handling in `prepareSpeechUtterance`

**Status:** `[x] completed`

**Intent:**
When the Odia (`or-IN`) path is active but a text chunk is entirely ASCII/English (e.g. a partially
untranslated string or a brand name), the current code feeds it through the Odia transliteration
functions which produce garbled or no output. A short guard at the start of the Odia branch should
detect all-ASCII chunks and return them directly with `speechLang = 'en-IN'` so the browser speaks
them using an English voice instead of dropping them.

**Expected Outcomes:**
- Any chunk that contains no Odia Unicode characters (U+0B00–U+0B7F) is spoken by an English voice
- Chunks that contain Odia characters continue through the existing transliteration pipeline
- No regression for Hindi, Bengali, Punjabi, or other language paths

**Todo List:**
1. Open `Frontend-Scheme-Navigator-main/src/hooks/useVoiceReader.ts`
2. In `prepareSpeechUtterance`, locate the Odia branch (around line 493)
3. After the `const expanded = convertOdiaNumbersToWords(text)` call, add a guard:
   - If `expanded` has no Odia Unicode characters (test with `/[\u0B00-\u0B7F]/`), return
     `{ textToPronounce: expanded, speechLang: 'en-IN' }` immediately
4. This guard must be inserted before the voice-type checks (lines 498–527) so that all-English
   chunks bypass the Odia/Hindi/Bengali voice routing entirely

**Relevant Context:**
- File: `Frontend-Scheme-Navigator-main/src/hooks/useVoiceReader.ts`
- Function: `prepareSpeechUtterance` (line 482)
- The Odia Unicode block is U+0B00 to U+0B7F (Odia script range)

---

### Sub-Task 3 — Add missing voice reader UI phrases to glossary

**Status:** `[x] completed`

**Intent:**
`GlobalVoiceReader.tsx` calls `tp('Pause')`, `tp('Resume')`, and `tp('Reading...')` but none of these
phrases exist in `PHRASE_GLOSSARY`. So the voice reader toolbar always shows English button labels
even when Odia is selected. Add the three missing phrases with Odia (and other language) translations.

**Expected Outcomes:**
- Voice reader toolbar shows Odia labels: `ବିରାମ`, `ପୁନଃ ଆରମ୍ଭ`, `ପଢ଼ୁଛି...` when Odia is selected
- Other languages (hi-IN, bn-IN, pa-IN, etc.) also get correct translations
- No functional change — purely UI label fix

**Todo List:**
1. Open `Frontend-Scheme-Navigator-main/src/i18n/glossary.ts`
2. Add entry `'Pause'` with translations for all 11 Indian language codes
   - `'or-IN': 'ବିରାମ'`
   - `'hi-IN': 'रोकें'`, `'bn-IN': 'বিরতি'`, `'pa-IN': 'ਰੋਕੋ'`, etc.
3. Add entry `'Resume'` with translations
   - `'or-IN': 'ପୁନଃ ଆରମ୍ଭ'`
   - `'hi-IN': 'जारी रखें'`, `'bn-IN': 'পুনরায় শুরু'`, `'pa-IN': 'ਮੁੜ ਸ਼ੁਰੂ'`, etc.
4. Add entry `'Reading...'` with translations
   - `'or-IN': 'ପଢ଼ୁଛି...'`
   - `'hi-IN': 'पढ़ रहा है...'`, `'bn-IN': 'পড়ছে...'`, `'pa-IN': 'ਪੜ੍ਹ ਰਿਹਾ ਹੈ...'`, etc.
5. Insert these three entries near the other voice reader phrases (after line ~1425)

**Relevant Context:**
- File: `Frontend-Scheme-Navigator-main/src/i18n/glossary.ts`
- Existing nearby phrases: `'Voice Reader'` (line 1335), `'Listen to Page'` (line 1361)
- Consumer: `Frontend-Scheme-Navigator-main/src/components/common/GlobalVoiceReader.tsx` lines 104, 209, 214

---

## Summary Diagram

```
User selects Odia → clicks "Listen to Page"
        ↓
extractPageReadableText() reads DOM
        ↓
[Issue 1] DOM contains English text (untranslated or.ts keys)
        ↓
splitIntoSpeechChunks() → chunks with English text
        ↓
prepareSpeechUtterance(chunk, 'or-IN', odiaVoice)
        ↓
[Issue 2] English chunk enters Odia pipeline → garbled/skipped
        ↓
SpeechSynthesisUtterance with wrong lang → SILENT or WRONG VOICE
```

Fix flow after all three sub-tasks are applied:
```
User selects Odia → clicks "Listen to Page"
        ↓
extractPageReadableText() reads DOM (now in Odia thanks to Sub-Task 1)
        ↓
prepareSpeechUtterance(odiaChunk, 'or-IN', bestVoice)
        ↓
Odia text → correct transliteration path → spoken in Odia
Any ASCII chunk → Sub-Task 2 guard → en-IN voice fallback → spoken in English
UI labels → Sub-Task 3 glossary entries → Odia labels on toolbar
```
