"""Aozora Bunko API schemas."""

from typing import Optional

from pydantic import BaseModel


class AozoraWorkResponse(BaseModel):
    """Response for an Aozora work."""

    work_id: str
    title: str
    author_name: str
    author_id: str
    text_url: Optional[str]
    html_url: Optional[str]
    first_published: Optional[str]
    character_type: Optional[str]


class AozoraSearchResponse(BaseModel):
    """Response for Aozora search results."""

    works: list[AozoraWorkResponse]
    total: int


class AozoraAuthorResponse(BaseModel):
    """Response for an author."""

    author_id: str
    author_name: str
    work_count: int


class AozoraAuthorsResponse(BaseModel):
    """Response for popular authors."""

    authors: list[AozoraAuthorResponse]


class AozoraImportRequest(BaseModel):
    """Request to import an Aozora work."""

    work_id: str
    pre_tokenize: bool = True


class AozoraTextResponse(BaseModel):
    """Response with work text content."""

    work_id: str
    title: str
    author_name: str
    text: str
