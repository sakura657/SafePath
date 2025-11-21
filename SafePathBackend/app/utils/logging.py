"""Centralized logging helpers."""
from __future__ import annotations

import logging
from functools import lru_cache


def _configure_root_logger() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )


@lru_cache(maxsize=None)
def get_logger(name: str) -> logging.Logger:
    """Return a configured logger instance."""
    _configure_root_logger()
    return logging.getLogger(name)
