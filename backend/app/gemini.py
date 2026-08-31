"""Gemini (Google AI Studio) client wrapper + prompt templates.

The app stores chord charts as plain text with inline chords in square brackets
placed immediately before the syllable they land on, e.g.

    [G]Amazing [G/B]grace how [C]sweet the [G]sound
    To show a literal bracket in the output, double it: [[G]] renders as [G].
    Multiple chords in one bracket are space separated: [Gsus G]

Every generation prompt restates this contract so model output drops straight
into the existing renderer (see src/lib/chords.js on the frontend).
"""
from __future__ import annotations

import json
import re

from google import genai
from google.genai import types
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.config import get_settings

_client: genai.Client | None = None


class GeminiError(RuntimeError):
    pass


def client() -> genai.Client:
    global _client
    if _client is None:
        key = get_settings().google_api_key
        if not key:
            raise GeminiError("GOOGLE_API_KEY is not configured")
        _client = genai.Client(api_key=key)
    return _client


CHORD_FORMAT_RULES = """CHORD CHART FORMAT (follow exactly):
- Output plain text only. No markdown, no code fences, no commentary.
- Put each chord in square brackets immediately before the lyric syllable it
  falls on, inline with the lyrics: "[G]Amazing [C]grace".
- Instrumental lines may be brackets only: "[C] [G] [Am] [F]".
- Multiple chords sharing one position are space separated in one bracket: "[Gsus G]".
- To render a literal bracket, double it: "[[G]]" shows as "[G]".
- Separate song sections (Verse, Chorus, Bridge) with a blank line. A short
  section label on its own line is fine (e.g. "Chorus").
- Keep chords diatonic to the given key unless the song clearly needs otherwise.
"""


def _extract_json(text: str) -> dict:
    text = text.strip()
    text = re.sub(r"^```(?:json)?|```$", "", text.strip(), flags=re.MULTILINE).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        raise GeminiError(f"Model did not return JSON: {text[:300]}")


def _strip_fences(text: str) -> str:
    return re.sub(r"^```[a-z]*\n?|\n?```$", "", text.strip(), flags=re.MULTILINE).strip()


@retry(
    retry=retry_if_exception_type(Exception),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=20),
    reraise=True,
)
def _generate(prompt: str, *, system: str, json_out: bool, temperature: float = 0.4) -> str:
    settings = get_settings()
    cfg = types.GenerateContentConfig(
        system_instruction=system,
        temperature=temperature,
        response_mime_type="application/json" if json_out else "text/plain",
    )
    resp = client().models.generate_content(
        model=settings.gemini_model, contents=prompt, config=cfg
    )
    if not resp.text:
        raise GeminiError("Empty response from Gemini")
    return resp.text


# --- Feature calls -----------------------------------------------------------


def generate_chords(
    *, title: str, key: str, style: str, existing_lyrics: str, language_hint: str
) -> dict:
    system = (
        "You are a worship music director who writes accurate, singable chord charts. "
        + CHORD_FORMAT_RULES
    )
    parts = [f'Song title: "{title}".']
    if key:
        parts.append(f"Target key: {key}.")
    if style:
        parts.append(f"Style/feel: {style}.")
    if language_hint:
        parts.append(f"Language: {language_hint}.")
    if existing_lyrics.strip():
        parts.append(
            "Use these existing lyrics; add chords, fix obvious typos, keep the wording:\n"
            + existing_lyrics
        )
    else:
        parts.append(
            "Provide the well-known lyrics for this song from memory. If you are not "
            "confident of the exact lyrics, return an empty 'lyrics' string and explain "
            "in 'notes'."
        )
    parts.append(
        'Respond as JSON: {"lyrics": "<chart in the format above>", '
        '"key": "<key you used>", "notes": "<short note or warnings>"}'
    )
    data = _extract_json(_generate("\n".join(parts), system=system, json_out=True))
    return {
        "lyrics": (data.get("lyrics") or "").strip(),
        "key": (data.get("key") or key).strip(),
        "notes": (data.get("notes") or "").strip(),
        "model": get_settings().gemini_model,
    }


def suggest_setlist(
    *, theme: str, occasion: str, duration_min: int | None, count: int | None, library: list[dict]
) -> dict:
    system = (
        "You are a worship pastor planning a service. You pick songs only from the "
        "provided library and order them for smooth musical and thematic flow "
        "(consider key relationships and tempo transitions)."
    )
    digest = "\n".join(
        f'- id={s["id"]} | "{s["title"]}" | key={s.get("key") or "?"} | '
        f'tempo={s.get("tempo") or "?"} | style={s.get("style") or "?"} | '
        f'tags={",".join(s.get("tags") or []) or "-"}'
        for s in library
    )
    ask = [f"Theme: {theme}."]
    if occasion:
        ask.append(f"Occasion: {occasion}.")
    if duration_min:
        ask.append(f"Approx duration: {duration_min} minutes.")
    ask.append(f"Number of songs: {count or 'your best judgement (4-6)'}.")
    ask.append("Library:\n" + digest)
    ask.append(
        'Respond as JSON: {"picks": [{"song_id": "<id>", "title": "<title>", '
        '"suggested_key": "<key>", "reason": "<why here / in this order>"}], '
        '"flow_notes": "<key & tempo flow summary>"}. '
        "Only use song_id values from the library."
    )
    data = _extract_json(_generate("\n".join(ask), system=system, json_out=True, temperature=0.6))
    return {
        "picks": data.get("picks", []),
        "flow_notes": (data.get("flow_notes") or "").strip(),
        "model": get_settings().gemini_model,
    }


_ASSISTANT_CHART_ACTIONS = {"simplify", "reharmonize", "number-notation"}


def assistant(*, action: str, target_level: str, title: str, key: str, lyrics: str) -> dict:
    is_chart = action in _ASSISTANT_CHART_ACTIONS
    system = "You are an expert worship guitarist and music teacher. " + (
        CHORD_FORMAT_RULES if is_chart else "Explain clearly and concisely for a volunteer musician."
    )
    instructions = {
        "simplify": f"Rewrite the chart using simpler, common open chords{' for a ' + target_level if target_level else ''}. Keep the same key and structure.",
        "reharmonize": "Offer a tasteful reharmonization (added 7ths, sus, passing chords) while keeping it playable.",
        "number-notation": "Convert every chord to Nashville number notation relative to the song key.",
        "explain": "Explain the chord progression: the key, the roman-numeral analysis, and why it works.",
    }[action]
    prompt = (
        f'Song: "{title}" (key {key or "unknown"}).\n'
        f"{instructions}\n\nCurrent chart:\n{lyrics}\n\n"
        + (
            'Respond as JSON: {"result": "<full replacement chart>", "notes": "<short note>"}'
            if is_chart
            else 'Respond as JSON: {"result": "<explanation, plain text or simple bullet lines>", "notes": ""}'
        )
    )
    data = _extract_json(_generate(prompt, system=system, json_out=True))
    return {
        "result": (data.get("result") or "").strip(),
        "is_chart": is_chart,
        "notes": (data.get("notes") or "").strip(),
        "model": get_settings().gemini_model,
    }


def rerank_search(*, query: str, candidates: list[dict], limit: int) -> dict:
    system = (
        "You rank worship songs by how well they match a search intent (theme, mood, "
        "scripture, occasion, or lyric fragment). Use only the given candidates."
    )
    digest = "\n".join(
        f'- id={c["id"]} | "{c["title"]}" | folder={c.get("folder")} | '
        f'tags={",".join(c.get("tags") or []) or "-"} | lyrics_excerpt="{(c.get("lyrics") or "")[:240].replace(chr(10), " ")}"'
        for c in candidates
    )
    prompt = (
        f'Search intent: "{query}".\nCandidates:\n{digest}\n\n'
        f'Return the top {limit} as JSON: {{"hits": [{{"song_id": "<id>", '
        '"score": <0..1>, "reason": "<one line>"}]}. Omit poor matches.'
    )
    data = _extract_json(_generate(prompt, system=system, json_out=True, temperature=0.2))
    return {"hits": data.get("hits", []), "model": get_settings().gemini_model}


def cleanup_chart(*, lyrics: str) -> dict:
    system = (
        "You normalize worship chord charts without changing the music or words. "
        + CHORD_FORMAT_RULES
    )
    prompt = (
        "Reformat this chart: fix inconsistent spacing, align chords to the right "
        "syllables, standardize section spacing. Do NOT change chords, words, or key.\n\n"
        f"{lyrics}\n\nReturn only the cleaned chart as plain text."
    )
    text = _strip_fences(_generate(prompt, system=system, json_out=False, temperature=0.1))
    return {"lyrics": text, "model": get_settings().gemini_model}


def embed_texts(texts: list[str]) -> list[list[float]]:
    settings = get_settings()
    resp = client().models.embed_content(
        model=settings.gemini_embedding_model, contents=texts
    )
    return [e.values for e in resp.embeddings]
