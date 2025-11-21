"""Timing utilities."""
from __future__ import annotations

import time
from dataclasses import dataclass


@dataclass
class Stopwatch:
    """Simple stopwatch for measuring elapsed time in milliseconds."""

    start_time: float = time.perf_counter()

    def reset(self) -> None:
        self.start_time = time.perf_counter()

    def elapsed_ms(self) -> int:
        return int((time.perf_counter() - self.start_time) * 1000)
