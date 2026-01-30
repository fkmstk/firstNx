from __future__ import annotations

from typing import Any, Callable, cast

import numpy as np
import polars as pl
from sklearn.ensemble import IsolationForest


ScanCsv = Callable[..., pl.LazyFrame]
scan_csv = cast(ScanCsv, pl.scan_csv)


def compute_correlation(path: str, columns: list[str]) -> dict[str, Any]:
    df = scan_csv(path).select(columns).collect()
    corr = df.corr()
    return {
        "columns": corr.columns,
        "matrix": corr.to_numpy().tolist(),
    }


def detect_anomalies(
    path: str,
    time_col: str,
    value_col: str,
    contamination: float,
) -> dict[str, Any]:
    df = scan_csv(path).select([time_col, value_col]).collect()
    pdf = df.to_pandas()
    values = pdf[value_col].to_numpy().reshape(-1, 1)

    contamination_value = float(contamination)
    model = IsolationForest(
        contamination=cast(Any, contamination_value),
        random_state=42,
    )
    model.fit(values)
    scores = model.score_samples(values)
    threshold = float(np.quantile(scores, contamination_value))

    points = []
    for idx, score in enumerate(scores):
        if score <= threshold:
            points.append(
                {
                    "index": int(idx),
                    "time": str(pdf[time_col].iloc[idx]),
                    "value": float(pdf[value_col].iloc[idx]),
                    "score": float(score),
                }
            )

    return {"threshold": threshold, "points": points}
