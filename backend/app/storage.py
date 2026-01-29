from __future__ import annotations

import os
import uuid
from typing import Dict

import polars as pl

from .models import ColumnInfo, DatasetMeta
from .settings import settings


datasets: Dict[str, DatasetMeta] = {}


def ensure_data_dir() -> str:
    os.makedirs(settings.data_dir, exist_ok=True)
    return settings.data_dir


def _infer_schema(path: str) -> list[ColumnInfo]:
    scan = pl.scan_csv(path)
    try:
        schema = scan.collect_schema()
    except AttributeError:
        schema = scan.schema
    columns: list[ColumnInfo] = []
    for name, dtype in schema.items():
        columns.append(ColumnInfo(name=name, dtype=str(dtype)))
    return columns


def add_dataset(filename: str, path: str) -> DatasetMeta:
    dataset_id = uuid.uuid4().hex
    columns = _infer_schema(path)
    meta = DatasetMeta(
        id=dataset_id,
        filename=filename,
        path=path,
        row_count=None,
        columns=columns,
    )
    datasets[dataset_id] = meta
    return meta


def list_datasets() -> list[DatasetMeta]:
    return list(datasets.values())


def get_dataset(dataset_id: str) -> DatasetMeta | None:
    return datasets.get(dataset_id)
