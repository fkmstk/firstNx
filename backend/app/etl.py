from __future__ import annotations

import re
from datetime import timedelta
from typing import Any, Callable

import polars as pl

from .models import FilterStep, ImputeStep, JoinStep, PipelineStep, SelectStep


DatasetLookup = Callable[[str], str]


def preview_csv(path: str, limit: int) -> dict[str, Any]:
    df = pl.scan_csv(source=path).limit(limit).collect()
    return {"columns": df.columns, "rows": df.to_dicts()}


def _parse_filter(expr: str) -> tuple[str, str, Any]:
    match = re.match(r"^\s*([A-Za-z0-9_]+)\s*(==|!=|>=|<=|>|<)\s*(.+?)\s*$", expr)
    if not match:
        raise ValueError("Invalid filter expression")
    column, op, raw = match.groups()
    raw = raw.strip()
    if (raw.startswith('"') and raw.endswith('"')) or (
        raw.startswith("'") and raw.endswith("'")
    ):
        value: Any = raw[1:-1]
    else:
        try:
            if "." in raw:
                value = float(raw)
            else:
                value = int(raw)
        except ValueError:
            value = raw
    return column, op, value


def _apply_filter(lf: pl.LazyFrame, step: FilterStep) -> pl.LazyFrame:
    column, op, value = _parse_filter(step.expr)
    col = pl.col(column)
    if op == "==":
        expr = col == value
    elif op == "!=":
        expr = col != value
    elif op == ">=":
        expr = col >= value
    elif op == "<=":
        expr = col <= value
    elif op == ">":
        expr = col > value
    elif op == "<":
        expr = col < value
    else:
        raise ValueError("Unsupported operator")
    return lf.filter(expr)


def _apply_impute(lf: pl.LazyFrame, step: ImputeStep) -> pl.LazyFrame:
    col = pl.col(step.column)
    if step.method == "ffill":
        expr = col.fill_null(strategy="forward")
    elif step.method == "bfill":
        expr = col.fill_null(strategy="backward")
    elif step.method == "mean":
        expr = col.fill_null(col.mean())
    elif step.method == "median":
        expr = col.fill_null(col.median())
    elif step.method == "zero":
        expr = col.fill_null(0)
    else:
        raise ValueError("Unsupported impute method")
    return lf.with_columns(expr.alias(step.column))


def _apply_select(lf: pl.LazyFrame, step: SelectStep) -> pl.LazyFrame:
    return lf.select(step.columns)


def _apply_join(
    current: pl.LazyFrame,
    step: JoinStep,
    dataset_lookup: DatasetLookup,
) -> pl.LazyFrame:
    left = current
    if step.left_id:
        left_path = dataset_lookup(step.left_id)
        left = pl.scan_csv(source=left_path)

    right_path = dataset_lookup(step.right_id)
    right = pl.scan_csv(source=right_path)

    left = left.with_columns(
        pl.col(step.left_time_col).cast(pl.Datetime("ms")).alias(step.left_time_col)
    )
    right = right.with_columns(
        pl.col(step.right_time_col).cast(pl.Datetime("ms")).alias(step.right_time_col)
    )

    left = left.sort(step.left_time_col)
    right = right.sort(step.right_time_col)

    tolerance: timedelta | None = None
    if step.tolerance_ms is not None:
        tolerance = timedelta(milliseconds=step.tolerance_ms)

    return left.join_asof(
        right,
        left_on=step.left_time_col,
        right_on=step.right_time_col,
        strategy=step.strategy,
        tolerance=tolerance,
    )


def apply_step(
    lf: pl.LazyFrame, step: PipelineStep, dataset_lookup: DatasetLookup
) -> pl.LazyFrame:
    if isinstance(step, JoinStep):
        return _apply_join(lf, step, dataset_lookup)
    if isinstance(step, ImputeStep):
        return _apply_impute(lf, step)
    if isinstance(step, FilterStep):
        return _apply_filter(lf, step)
    if isinstance(step, SelectStep):
        return _apply_select(lf, step)
    raise ValueError("Unknown step type")


def run_pipeline(
    base_path: str,
    steps: list[PipelineStep],
    dataset_lookup: DatasetLookup,
    result_path: str,
    progress_cb,
) -> dict[str, Any]:
    lf = pl.scan_csv(source=base_path)
    total = max(len(steps), 1)
    progress_cb(0.1, "パイプラインを開始")

    for idx, step in enumerate(steps):
        lf = apply_step(lf, step, dataset_lookup)
        progress = 0.1 + (0.7 * (idx + 1) / total)
        progress_cb(progress, f"ステップ {idx + 1}/{len(steps)} 完了")

    progress_cb(0.85, "結果を保存中")
    df = lf.collect()
    df.write_csv(result_path)
    progress_cb(0.95, "保存完了")

    return {
        "result_path": result_path,
        "row_count": df.height,
        "columns": df.columns,
    }
