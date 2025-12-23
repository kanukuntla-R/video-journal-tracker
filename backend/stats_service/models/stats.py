from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class DailyStat(BaseModel):
    date: str
    entries: int
    total_duration: int


class StatsSummary(BaseModel):
    total_entries: int
    total_duration: int
    avg_duration: float
    first_entry: Optional[datetime] = None
    last_entry: Optional[datetime] = None
    daily: List[DailyStat] = []

