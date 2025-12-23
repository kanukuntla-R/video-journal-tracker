from typing import List, Optional
from fastapi import APIRouter
from backend.stats_service.services.stats import (
    get_stats_summary,
    get_daily_stats,
)
from backend.stats_service.models.stats import StatsSummary, DailyStat

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/summary", response_model=StatsSummary)
async def stats_summary(
    user_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
):
    return await get_stats_summary(
        user_id=user_id,
        start_date=start_date,
        end_date=end_date,
    )


@router.get("/daily", response_model=List[DailyStat])
async def stats_daily(
    user_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
):
    return await get_daily_stats(
        user_id=user_id,
        start_date=start_date,
        end_date=end_date,
    )

