import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Dataset
from app.schemas import (
    ChartsResponse,
    DatasetOut,
    DatasetSummary,
    ForecastRequest,
    ForecastResponse,
)
from app.services.analysis_service import get_column_summaries
from app.services.chart_service import suggest_charts
from app.services.file_service import read_dataframe, save_upload, validate_extension
from app.services.forecast_service import run_forecast

router = APIRouter()


@router.post("/upload", response_model=DatasetOut)
async def upload_file(file: UploadFile, db: Session = Depends(get_db)):
    if not file.filename or not validate_extension(file.filename):
        raise HTTPException(
            status_code=400,
            detail="Only CSV and Excel files (.csv, .xlsx, .xls) are allowed.",
        )

    content = await file.read()
    if len(content) > 100 * 1024 * 1024:  # 100 MB limit
        raise HTTPException(status_code=400, detail="File too large (max 100 MB).")

    filepath = save_upload(file.filename, content)
    df = read_dataframe(filepath)

    dataset = Dataset(
        filename=file.filename,
        filepath=filepath,
        rows=len(df),
        columns=len(df.columns),
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)
    return dataset


@router.get("/datasets", response_model=list[DatasetOut])
def list_datasets(db: Session = Depends(get_db)):
    return db.query(Dataset).order_by(Dataset.created_at.desc()).all()


@router.get("/dataset/{dataset_id}/summary", response_model=DatasetSummary)
def dataset_summary(dataset_id: int, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    df = read_dataframe(dataset.filepath)
    summaries = get_column_summaries(df)

    return DatasetSummary(
        id=dataset.id,
        filename=dataset.filename,
        rows=dataset.rows,
        columns_count=dataset.columns,
        columns=summaries,
    )


@router.get("/dataset/{dataset_id}/preview")
def dataset_preview(dataset_id: int, page: int = 1, size: int = 50, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    df = read_dataframe(dataset.filepath)
    start = (page - 1) * size
    end = start + size
    subset = df.iloc[start:end]

    return {
        "columns": list(df.columns),
        "rows": subset.fillna("").values.tolist(),
        "total": len(df),
        "page": page,
        "size": size,
    }


@router.get("/dataset/{dataset_id}/charts", response_model=ChartsResponse)
def dataset_charts(dataset_id: int, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    df = read_dataframe(dataset.filepath)
    # Try to parse date columns
    for col in df.columns:
        if df[col].dtype == "object":
            try:
                df[col] = pd.to_datetime(df[col], infer_datetime_format=True)
            except (ValueError, TypeError):
                pass

    charts = suggest_charts(df)
    return ChartsResponse(charts=charts)


@router.post("/dataset/{dataset_id}/forecast", response_model=ForecastResponse)
def dataset_forecast(
    dataset_id: int,
    body: ForecastRequest,
    db: Session = Depends(get_db),
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    df = read_dataframe(dataset.filepath)

    if body.date_column not in df.columns or body.value_column not in df.columns:
        raise HTTPException(
            status_code=400, detail="Specified columns not found in dataset."
        )

    try:
        historical, forecast = run_forecast(
            df, body.date_column, body.value_column, body.periods
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Forecast failed: {exc}")

    return ForecastResponse(historical=historical, forecast=forecast)
