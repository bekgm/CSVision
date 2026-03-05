from datetime import datetime
from typing import Any

from pydantic import BaseModel


class DatasetOut(BaseModel):
    id: int
    filename: str
    rows: int
    columns: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ColumnSummary(BaseModel):
    name: str
    type: str
    missing: int
    unique: int
    mean: float | None = None
    min: float | None = None
    max: float | None = None
    std: float | None = None
    top: str | None = None
    freq: int | None = None


class DatasetSummary(BaseModel):
    id: int
    filename: str
    rows: int
    columns_count: int
    columns: list[ColumnSummary]


class ChartConfig(BaseModel):
    column: str
    chart_type: str
    data: list[dict[str, Any]]


class ChartsResponse(BaseModel):
    charts: list[ChartConfig]


class ForecastRequest(BaseModel):
    date_column: str
    value_column: str
    periods: int = 30


class ForecastPoint(BaseModel):
    date: str
    value: float


class ForecastResponse(BaseModel):
    historical: list[ForecastPoint]
    forecast: list[ForecastPoint]
