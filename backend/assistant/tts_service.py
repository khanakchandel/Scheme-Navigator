"""
High-fidelity Neural Text-to-Speech (TTS) service for SchemeNavigator.
Provides authentic Indic phonetics (including Eastern Indic / Odia phonetic mapping)
with zero credit consumption and instant disk caching.
"""
import asyncio
import hashlib
import logging
import os
import re
from django.conf import settings
import edge_tts

logger = logging.getLogger(__name__)

CACHE_DIR = getattr(settings, "TTS_CACHE_DIR", os.path.join(settings.BASE_DIR, "cache_tts"))
os.makedirs(CACHE_DIR, exist_ok=True)

ONES = [
    '', 'ଏକ', 'ଦୁଇ', 'ତିନି', 'ଚାରି', 'ପାଞ୍ଚ', 'ଛଅ', 'ସାତ', 'ଆଠ', 'ନଅ', 'ଦଶ',
    'ଏଗାର', 'ବାର', 'ତେର', 'ଚଉଦ', 'ପନ୍ଦର', 'ଷୋହଳ', 'ସତର', 'ଅଠର', 'ଉଣେଇଶ', 'କୋଡ଼ିଏ',
    'ଏକୋଇଶ', 'ବାଇଶ', 'ତେଇଶ', 'ଚବିଶ', 'ପଚିଶ', 'ଛବିଶ', 'ସତେଇଶ', 'ଅଠେଇଶ', 'ଅଣତିରିଶ', 'ତିରିଶ',
    'ଏକତିରିଶ', 'ବତିଶ', 'ତେତିଶ', 'ଚୌତିଶ', 'ପଇଁତିରିଶ', 'ଛତିଶ', 'ସଇଁତିରିଶ', 'ଅଠତିରିଶ', 'ଅଣଚାଳିଶ', 'ଚାଳିଶ',
    'ଏକଚାଳିଶ', 'ବିୟାଳିଶ', 'ତେୟାଳିଶ', 'ଚଉରାଳିଶ', 'ପଞ୍ଚଚାଳିଶ', 'ଛୟାଳିଶ', 'ସତଚାଳିଶ', 'ଅଠଚାଳିଶ', 'ଅଣଚାଶ', 'ପଚାଶ',
    'ଏକାବନ', 'ବାଅନ', 'ତେପନ', 'ଚଉବନ', 'ପଞ୍ଚାବନ', 'ଛପନ', 'ସତାବନ', 'ଅଠାବନ', 'ଅଣଷଠି', 'ଷାଠିଏ',
    'ଏକଷଠି', 'ବାଷଠି', 'ତେଷଠି', 'ଚୌଷଠି', 'ପଞ୍ଚଷଠି', 'ଛଷଠି', 'ସତଷଠି', 'ଅଠଷଠି', 'ଅଣସତରୀ', 'ସତୁରୀ',
    'ଏକସ୍ତରୀ', 'ବାସ୍ତରୀ', 'ତେସ୍ତରୀ', 'ଚଉସ୍ତରୀ', 'ପଞ୍ଚସ୍ତରୀ', 'ଛଅସ୍ତରୀ', 'ସତସ୍ତରୀ', 'ଅଠସ୍ତରୀ', 'ଅଣଅଶୀ', 'ଅଶୀ',
    'ଏକାଶୀ', 'ବିୟାଶୀ', 'ତେୟାଶୀ', 'ଚଉରାଶୀ', 'ପଞ୍ଚାଶୀ', 'ଛୟାଶୀ', 'ସତାଶୀ', 'ଅଠାଶୀ', 'ଅଣନବେ', 'ନବେ',
    'ଏକାନବେ', 'ବିୟାନବେ', 'ତେୟାନବେ', 'ଚଉରାନବେ', 'ପଞ୍ଚାନବେ', 'ଛୟାନବେ', 'ସତାନବେ', 'ଅଠାନବେ', 'ଅଣଶହେ', 'ଶହେ'
]


def num_to_words(n: int) -> str:
    if n <= 100:
        return ONES[n] if n < len(ONES) else str(n)
    if n < 1000:
        h = n // 100
        rem = n % 100
        h_str = 'ଶହେ' if h == 1 else f"{ONES[h]} ଶହ"
        return f"{h_str} {num_to_words(rem)}" if rem > 0 else h_str
    if n < 100000:
        th = n // 1000
        rem = n % 1000
        th_str = f"{num_to_words(th)} ହଜାର"
        return f"{th_str} {num_to_words(rem)}" if rem > 0 else th_str
    if n < 10000000:
        lk = n // 100000
        rem = n % 100000
        lk_str = f"{num_to_words(lk)} ଲକ୍ଷ"
        return f"{lk_str} {num_to_words(rem)}" if rem > 0 else lk_str
    return str(n)


def convert_odia_numbers(text: str) -> str:
    if not text:
        return ""
    # Odia digits to ASCII
    s = re.sub(r'[\u0b66-\u0b6f]', lambda m: str(ord(m.group(0)) - 0x0b66), text)
    s = re.sub(r'(\d+),(\d+)', r'\1\2', s)
    s = re.sub(r'₹\s*(\d+(?:\.\d+)?)\s*(?:Lakhs?|Lac|L)\b', r'\1 ଲକ୍ଷ ଟଙ୍କା', s, flags=re.I)
    s = re.sub(r'₹\s*(\d+(?:\.\d+)?)\s*(?:Crores?|Cr)\b', r'\1 କୋଟି ଟଙ୍କା', s, flags=re.I)
    s = re.sub(r'₹\s*(\d+(?:\.\d+)?)', r'\1 ଟଙ୍କା', s)
    s = re.sub(r'₹', 'ଟଙ୍କା ', s)
    s = re.sub(r'(\d+(?:\.\d+)?)\s*(?:Lakhs?|Lac|L)\b', r'\1 ଲକ୍ଷ', s, flags=re.I)
    s = re.sub(r'(\d+(?:\.\d+)?)\s*(?:Crores?|Cr)\b', r'\1 କୋଟି', s, flags=re.I)
    s = re.sub(r'/yr\b', ' ବାର୍ଷିକ', s, flags=re.I)
    s = re.sub(r'/mo\b', ' ମାସିକ', s, flags=re.I)
    s = re.sub(r'(\d+(?:\.\d+)?)\s*%', r'\1 ପ୍ରତିଶତ', s)
    s = re.sub(r'(\d+(?:\.\d+)?)\s*\+', r'\1 ରୁ ଅଧିକ', s)
    s = re.sub(r'(\d+)\.(\d+)', lambda m: f"{num_to_words(int(m.group(1)))} ଦଶମିକ {num_to_words(int(m.group(2)))}", s)
    s = re.sub(r'\b\d+\b', lambda m: num_to_words(int(m.group(0))) if int(m.group(0)) <= 9999999 else m.group(0), s)
    return s


def prepare_odia_for_neural_speech(text: str) -> str:
    """
    Transliterates Odia Unicode characters to Devanagari phonetics with precise
    Odia phonetic mapping (crisp dental 'S', authentic 'J' for ଯ, 'Y' for ୟ, 'W' for ୱ, 'L' for ଳ,
    and composite matras) so that the neural voice speaks with natural, authentic Odia pronunciation
    without Bengali sibilant distortions, and preserving authentic Odia inherent
    final vowels so Hindi engines do not delete word-ending vowels with foreign schwa-deletion.
    """
    raw_expanded = convert_odia_numbers(text)

    # 1. Naturalize geminate retroflex nasal ଣ୍ଣ -> ଣ (e.g. ସମ୍ପୂର୍ଣ୍ଣ -> ସମ୍ପୂର୍ଣ -> सम्पूर्ण)
    s = raw_expanded.replace('ଣ୍ଣ', 'ଣ')

    # 2. Preserve authentic Odia word-final vowels ('o' sound) on open-ended syllables:
    # In Odia, words ending in -ର, -ଜ, -ବ, -ଭ, -ଳ, -ତ do NOT drop their vowels like Hindi!
    tokens = re.split(r'(\s+|[.,!?।॥;:\(\)\[\]"\'\-]+)', s)
    out_tokens = []
    for tok in tokens:
        if not tok or re.match(r'^\s+$|[.,!?।॥;:\(\)\[\]"\'\-]+', tok):
            out_tokens.append(tok)
            continue

        if tok.endswith('ର'):
            tok = tok[:-1] + 'ରୋ'
        elif tok.endswith('ଜ') and len(tok) > 1:
            tok = tok[:-1] + 'ଜୋ'
        elif tok.endswith('ବ') and len(tok) > 1:
            tok = tok[:-1] + 'ବୋ'
        elif tok.endswith('ଭ') and len(tok) > 1:
            tok = tok[:-1] + 'ଭୋ'
        elif tok.endswith('ଳ') and len(tok) > 1:
            tok = tok[:-1] + 'ଳୋ'
        elif tok.endswith('ତ') and len(tok) > 2:
            tok = tok[:-1] + 'ତୋ'

        out_tokens.append(tok)

    expanded = ''.join(out_tokens)
    res = []
    i = 0
    n = len(expanded)
    while i < n:
        ch = expanded[i]
        c = ord(ch)
        if 0x0B00 <= c <= 0x0B7F:
            if c == 0x0B2F:    # ଯ -> if preceded by halant (୍), it's a ya-phala pronounced as 'य' (\u092F). Otherwise independent 'ज' (\u091C)
                if i > 0 and ord(expanded[i - 1]) == 0x0B4D:
                    res.append('\u092F')
                else:
                    res.append('\u091C')
            elif c == 0x0B5F:  # ୟ -> य (Y)
                res.append('\u092F')
            elif c == 0x0B71:  # ୱ -> व (W/V)
                res.append('\u0935')
            elif c == 0x0B33:  # ଳ -> ल (L)
                res.append('\u0932')
            elif c == 0x0B38:  # ସ -> स (Crisp Dental S, never Bengali Sh!)
                res.append('\u0938')
            elif c == 0x0B36:  # ଶ -> श
                res.append('\u0936')
            elif c == 0x0B37:  # ଷ -> ष
                res.append('\u0937')
            elif c == 0x0B5C:  # ଡ଼ -> ड़ (Flap D)
                res.append('\u095C')
            elif c == 0x0B5D:  # ଢ଼ -> ढ़ (Flap Dh)
                res.append('\u095D')
            elif c == 0x0B47 and i + 1 < n and ord(expanded[i + 1]) == 0x0B3E:  # େ + ା = ୋ (ो)
                res.append('\u094B')
                i += 1
            elif c == 0x0B47 and i + 1 < n and ord(expanded[i + 1]) == 0x0B57:  # େ + ୗ = ୌ (ौ)
                res.append('\u094C')
                i += 1
            elif 0x0B01 <= c <= 0x0B75:
                # Direct script conversion offset: 0x0B00 - 0x0900 = 0x0200
                res.append(chr(c - 0x0200))
            else:
                res.append(ch)
        else:
            res.append(ch)
        i += 1
    return ''.join(res)


async def synthesize_neural_speech(text: str, lang: str = "or-IN", rate: float = 1.0) -> bytes:
    """
    Synthesizes speech using edge-tts neural voices with disk caching.
    Returns MP3 audio bytes.
    """
    clean_text = text.strip()
    if not clean_text:
        return b""

    lang_prefix = (lang or "or-IN").lower().split("-")[0]

    # Voice selection
    if lang_prefix == "or":
        # SwaraNeural speaks crisp Indic phonetics with authentic Dental S, J, and Odia cadence
        voice = "hi-IN-SwaraNeural"
        speech_text = prepare_odia_for_neural_speech(clean_text)
    elif lang_prefix == "hi":
        voice = "hi-IN-SwaraNeural"
        speech_text = clean_text
    elif lang_prefix == "bn":
        voice = "bn-IN-TanishaaNeural"
        speech_text = clean_text
    elif lang_prefix == "ta":
        voice = "ta-IN-PallaviNeural"
        speech_text = clean_text
    elif lang_prefix == "te":
        voice = "te-IN-ShrutiNeural"
        speech_text = clean_text
    elif lang_prefix == "gu":
        voice = "gu-IN-DhwaniNeural"
        speech_text = clean_text
    elif lang_prefix == "mr":
        voice = "mr-IN-AarohiNeural"
        speech_text = clean_text
    elif lang_prefix == "kn":
        voice = "kn-IN-SapnaNeural"
        speech_text = clean_text
    elif lang_prefix == "ml":
        voice = "ml-IN-SobhanaNeural"
        speech_text = clean_text
    elif lang_prefix == "ur":
        voice = "ur-IN-GulNeural"
        speech_text = clean_text
    else:
        voice = "en-IN-NeerjaNeural"
        speech_text = clean_text

    # Calculate rate string
    rate_percent = int(round((rate - 1.0) * 100))
    rate_str = f"{'+' if rate_percent >= 0 else ''}{rate_percent}%"

    # Cache key
    cache_key = hashlib.md5(f"{voice}:{rate_str}:{clean_text}".encode("utf-8")).hexdigest()
    cache_file = os.path.join(CACHE_DIR, f"{cache_key}.mp3")

    # Return cached audio if available
    if os.path.exists(cache_file) and os.path.getsize(cache_file) > 0:
        try:
            with open(cache_file, "rb") as f:
                return f.read()
        except Exception as e:
            logger.warning(f"Failed to read TTS cache file: {e}")

    # Generate fresh audio via edge_tts
    tts = edge_tts.Communicate(speech_text, voice, rate=rate_str)
    audio = b""
    async for chunk in tts.stream():
        if chunk["type"] == "audio":
            audio += chunk["data"]

    if audio:
        try:
            with open(cache_file, "wb") as f:
                f.write(audio)
        except Exception as e:
            logger.warning(f"Failed to write TTS cache file: {e}")

    return audio
