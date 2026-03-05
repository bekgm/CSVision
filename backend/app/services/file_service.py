from pathlib import Path

import pandas as pd

from app.config import UPLOAD_DIR


ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}


def validate_extension(filename: str) -> bool:
    return Path(filename).suffix.lower() in ALLOWED_EXTENSIONS


def read_dataframe(filepath: str) -> pd.DataFrame:
    path = Path(filepath)
    if path.suffix.lower() == ".csv":
        return pd.read_csv(path)
    return pd.read_excel(path)


def save_upload(filename: str, content: bytes) -> str:
    safe_name = Path(filename).name  # prevent path traversal
    dest = UPLOAD_DIR / safe_name
    counter = 1
    while dest.exists():
        stem = Path(safe_name).stem
        suffix = Path(safe_name).suffix
        dest = UPLOAD_DIR / f"{stem}_{counter}{suffix}"
        counter += 1
    dest.write_bytes(content)
    return str(dest)
