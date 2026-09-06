from typing import List, Optional
from fastapi import APIRouter, Depends
from backend.shared.auth import get_auth_user_id, resolve_user_id
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
    auth_user_id: str | None = Depends(get_auth_user_id),
):
    resolved_user_id = resolve_user_id(user_id, auth_user_id)
    return await get_stats_summary(
        user_id=resolved_user_id,
        start_date=start_date,
        end_date=end_date,
    )


@router.get("/daily", response_model=List[DailyStat])
async def stats_daily(
    user_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    auth_user_id: str | None = Depends(get_auth_user_id),
):
    resolved_user_id = resolve_user_id(user_id, auth_user_id)
    return await get_daily_stats(
        user_id=resolved_user_id,
        start_date=start_date,
        end_date=end_date,
    )
