"""
Unit tests for domain value objects.

No database, no Django. Pure Python.
"""

import pytest

from apps.core.domain.value_objects import Domain, DurationMinutes


class TestDomain:
    @pytest.mark.parametrize("raw,expected", [
        ("facebook.com", "facebook.com"),
        ("FACEBOOK.COM", "facebook.com"),
        ("https://facebook.com", "facebook.com"),
        ("http://facebook.com/feed", "facebook.com"),
        ("www.youtube.com", "youtube.com"),
        ("sub.domain.example.co.uk", "sub.domain.example.co.uk"),
    ])
    def test_valid_domains_normalized(self, raw, expected):
        d = Domain(raw)
        assert d.value == expected

    @pytest.mark.parametrize("bad", [
        "not a domain",
        "facebook",        # no TLD
        "",
        "a" * 254 + ".com",  # too long
    ])
    def test_invalid_domains_raise(self, bad):
        with pytest.raises(ValueError):
            Domain(bad)

    def test_equality(self):
        assert Domain("facebook.com") == Domain("FACEBOOK.COM")

    def test_str(self):
        assert str(Domain("facebook.com")) == "facebook.com"


class TestDurationMinutes:
    def test_valid_duration(self):
        d = DurationMinutes(30)
        assert d.value == 30
        assert int(d) == 30

    @pytest.mark.parametrize("bad", [0, -1, 1441, 9999])
    def test_out_of_range_raises(self, bad):
        with pytest.raises(ValueError):
            DurationMinutes(bad)

    def test_non_int_raises(self):
        with pytest.raises(TypeError):
            DurationMinutes(1.5)  # type: ignore[arg-type]

    def test_max_boundary(self):
        d = DurationMinutes(1440)
        assert d.value == 1440

    def test_min_boundary(self):
        d = DurationMinutes(1)
        assert d.value == 1
