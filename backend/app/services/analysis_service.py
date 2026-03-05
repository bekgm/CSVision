import numpy as np
import pandas as pd

from app.schemas import ColumnSummary


def get_column_summaries(df: pd.DataFrame) -> list[ColumnSummary]:
    summaries: list[ColumnSummary] = []
    for col in df.columns:
        series = df[col]
        missing = int(series.isna().sum())
        unique = int(series.nunique())

        if pd.api.types.is_numeric_dtype(series):
            summaries.append(
                ColumnSummary(
                    name=col,
                    type="number",
                    missing=missing,
                    unique=unique,
                    mean=_safe_float(series.mean()),
                    min=_safe_float(series.min()),
                    max=_safe_float(series.max()),
                    std=_safe_float(series.std()),
                )
            )
        elif pd.api.types.is_datetime64_any_dtype(series):
            summaries.append(
                ColumnSummary(
                    name=col,
                    type="date",
                    missing=missing,
                    unique=unique,
                )
            )
        else:
            mode = series.mode()
            top_val = str(mode.iloc[0]) if len(mode) > 0 else None
            freq_val = int(series.value_counts().iloc[0]) if len(series.value_counts()) > 0 else None
            summaries.append(
                ColumnSummary(
                    name=col,
                    type="category",
                    missing=missing,
                    unique=unique,
                    top=top_val,
                    freq=freq_val,
                )
            )
    return summaries


def _safe_float(val) -> float | None:
    if val is None or (isinstance(val, float) and np.isnan(val)):
        return None
    return round(float(val), 4)
