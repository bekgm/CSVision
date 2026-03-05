from typing import Any

import pandas as pd

from app.schemas import ChartConfig


def suggest_charts(df: pd.DataFrame) -> list[ChartConfig]:
    charts: list[ChartConfig] = []

    for col in df.columns:
        series = df[col].dropna()
        if series.empty:
            continue

        if pd.api.types.is_numeric_dtype(series):
            # Histogram
            hist_data = _build_histogram(series, col)
            charts.append(
                ChartConfig(column=col, chart_type="histogram", data=hist_data)
            )
            # Boxplot summary
            box_data = _build_boxplot(series, col)
            charts.append(
                ChartConfig(column=col, chart_type="boxplot", data=box_data)
            )

        elif pd.api.types.is_datetime64_any_dtype(series):
            # Find first numeric column for line chart
            for num_col in df.select_dtypes(include="number").columns:
                line_data = _build_line(df, col, num_col)
                charts.append(
                    ChartConfig(
                        column=f"{col} vs {num_col}",
                        chart_type="line",
                        data=line_data,
                    )
                )
                break  # one line chart per date column

        else:
            bar_data = _build_bar(series, col)
            charts.append(
                ChartConfig(column=col, chart_type="bar", data=bar_data)
            )

    return charts


def _build_histogram(series: pd.Series, col: str) -> list[dict[str, Any]]:
    counts, bin_edges = pd.cut(series, bins=20, retbins=True)
    value_counts = counts.value_counts().sort_index()
    data = []
    for interval, count in value_counts.items():
        data.append({"bin": str(interval), "count": int(count)})
    return data


def _build_boxplot(series: pd.Series, col: str) -> list[dict[str, Any]]:
    q1 = float(series.quantile(0.25))
    median = float(series.median())
    q3 = float(series.quantile(0.75))
    return [
        {
            "column": col,
            "min": float(series.min()),
            "q1": q1,
            "median": median,
            "q3": q3,
            "max": float(series.max()),
        }
    ]


def _build_line(
    df: pd.DataFrame, date_col: str, value_col: str
) -> list[dict[str, Any]]:
    temp = df[[date_col, value_col]].dropna().sort_values(date_col)
    # Downsample to max 200 points for performance
    if len(temp) > 200:
        step = len(temp) // 200
        temp = temp.iloc[::step]
    return [
        {"date": str(row[date_col]), "value": float(row[value_col])}
        for _, row in temp.iterrows()
    ]


def _build_bar(series: pd.Series, col: str) -> list[dict[str, Any]]:
    top = series.value_counts().head(20)
    return [
        {"category": str(cat), "count": int(cnt)} for cat, cnt in top.items()
    ]
