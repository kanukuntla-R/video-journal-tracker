from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId
from pydantic import ConfigDict


class PyObjectId(ObjectId):

    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    # @classmethod
    # def validate(cls, v):
    #     if not ObjectId.is_valid(v):
    #         raise ValueError("Invalid ObjectId")
    #     return ObjectId(v)

    @classmethod
    def validate(cls, v, info=None):
        """
        Pydantic v2 will pass (cls, v, info).
        We accept 'info' but we don't need to use it.
        """
        # If it's already an ObjectId (like from Mongo), just return it
        if isinstance(v, ObjectId):
            return v

        # If it's a string, make sure it's a valid ObjectId string
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")

        return ObjectId(v)
    
    @classmethod
    def __get_pydantic_json_schema__(cls, core_schema, handler):
        # Fix for Pydantic v2 – returns ObjectId as a string in docs
        return {"type": "string"}



class JournalEntry(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: str
    date: str
    video_path: str
    transcript: Optional[str]
    summary: Optional[str]
    duration: int
    created_at: datetime

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }
