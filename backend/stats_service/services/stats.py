from datetime import datetime
from typing import Any, Dict, List, Optional
from backend.shared.mongo import get_db


def _match(
    user_id: Optional[str],
    start_date: Optional[str],
    end_date: Optional[str],
) -> Dict[str, Any]:
    match: Dict[str, Any] = {}
    if user_id:
        match["user_id"] = user_id

    date_filter: Dict[str, Any] = {}
    if start_date:
        date_filter["$gte"] = datetime.fromisoformat(start_date)
    if end_date:
        date_filter["$lte"] = datetime.fromisoformat(end_date)
    if date_filter:
        match["created_at"] = date_filter

    return match


async def get_stats_summary(
    user_id: Optional[str],
    start_date: Optional[str],
    end_date: Optional[str],
) -> Dict[str, Any]:
    match = _match(user_id, start_date, end_date)
    pipeline = [
        {"$match": match},
        {
            "$group": {
                "_id": None,
                "total_entries": {"$sum": 1},
                "total_duration": {"$sum": "$duration"},
                "first_entry": {"$min": "$created_at"},
                "last_entry": {"$max": "$created_at"},
            }
        },
    ]

    docs = await get_db()["journal"].aggregate(pipeline).to_list(length=1)
    doc = docs[0] if docs else {}
    total_entries = doc.get("total_entries", 0)
    total_duration = doc.get("total_duration", 0)
    avg_duration = (total_duration / total_entries) if total_entries else 0

    return {
        "total_entries": total_entries,
        "total_duration": total_duration,
        "avg_duration": avg_duration,
        "first_entry": doc.get("first_entry"),
        "last_entry": doc.get("last_entry"),
    }


async def get_daily_stats(
    user_id: Optional[str],
    start_date: Optional[str],
    end_date: Optional[str],
) -> List[Dict[str, Any]]:
    match = _match(user_id, start_date, end_date)
    pipeline = [
        {"$match": match},
        {
            "$group": {
                "_id": {
                    "$dateToString": {
                        "format": "%Y-%m-%d",
                        "date": "$created_at",
                    }
                },
                "entries": {"$sum": 1},
                "total_duration": {"$sum": "$duration"},
            }
        },
        {"$sort": {"_id": 1}},
    ]

    docs = await get_db()["journal"].aggregate(pipeline).to_list(length=None)
    return [
        {
            "date": doc["_id"],
            "entries": doc["entries"],
            "total_duration": doc["total_duration"],
        }
        for doc in docs
    ]

