import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression

from app.schemas import ForecastPoint


def run_forecast(
    df: pd.DataFrame,
    date_column: str,
    value_column: str,
    periods: int = 30,
) -> tuple[list[ForecastPoint], list[ForecastPoint]]:
    temp = df[[date_column, value_column]].dropna().copy()
    temp[date_column] = pd.to_datetime(temp[date_column])
    temp = temp.sort_values(date_column).reset_index(drop=True)

    # Convert dates to ordinal numbers for regression
    temp["ordinal"] = temp[date_column].map(pd.Timestamp.toordinal)
    X = temp[["ordinal"]].values
    y = temp[value_column].values.astype(float)

    model = LinearRegression()
    model.fit(X, y)

    # Build historical points
    historical = [
        ForecastPoint(
            date=str(row[date_column].date()), value=round(float(row[value_column]), 4)
        )
        for _, row in temp.iterrows()
    ]

    # Determine frequency from data
    if len(temp) >= 2:
        freq = pd.infer_freq(temp[date_column])
        if freq is None:
            median_diff = temp[date_column].diff().median()
        else:
            median_diff = None
    else:
        median_diff = pd.Timedelta(days=1)
        freq = None

    # Generate future dates
    last_date = temp[date_column].iloc[-1]
    future_dates = []
    for i in range(1, periods + 1):
        if freq:
            future_dates.append(last_date + pd.DateOffset(1) * i)
        else:
            future_dates.append(last_date + median_diff * i)

    future_ordinals = np.array(
        [pd.Timestamp(d).toordinal() for d in future_dates]
    ).reshape(-1, 1)
    predictions = model.predict(future_ordinals)

    forecast = [
        ForecastPoint(
            date=str(pd.Timestamp(d).date()), value=round(float(v), 4)
        )
        for d, v in zip(future_dates, predictions)
    ]

    return historical, forecast
