from app.gemini import _extract_json, _strip_fences


def test_extract_json_plain():
    assert _extract_json('{"a": 1}') == {"a": 1}


def test_extract_json_fenced():
    assert _extract_json('```json\n{"a": 1}\n```') == {"a": 1}


def test_extract_json_with_prose():
    assert _extract_json('Here you go:\n{"lyrics": "[G]hi"}\nThanks') == {"lyrics": "[G]hi"}


def test_strip_fences():
    assert _strip_fences("```\n[C]hello\n```") == "[C]hello"
    assert _strip_fences("[C]hello") == "[C]hello"
