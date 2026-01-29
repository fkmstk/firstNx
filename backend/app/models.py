from __future__ import annotations

from typing import Annotated, Literal, Optional, Union
from pydantic import BaseModel, Field


class ColumnInfo(BaseModel):
    name: str
    dtype: str


class DatasetMeta(BaseModel):
    id: str
    filename: str
    path: str
    row_count: Optional[int] = None
    columns: list[ColumnInfo]


class JoinStep(BaseModel):
    type: Literal["join"] = "join"
    left_id: Optional[str] = None
    right_id: str
    left_time_col: str
    right_time_col: str
    tolerance_ms: Optional[int] = None
    strategy: Literal["backward", "forward", "nearest"] = "nearest"


class ImputeStep(BaseModel):
    type: Literal["impute"] = "impute"
    column: str
    method: Literal["ffill", "bfill", "mean", "median", "zero"]


class FilterStep(BaseModel):
    type: Literal["filter"] = "filter"
    expr: str


class SelectStep(BaseModel):
    type: Literal["select"] = "select"
    columns: list[str]


PipelineStep = Annotated[
    Union[JoinStep, ImputeStep, FilterStep, SelectStep],
    Field(discriminator="type"),
]


class PipelineRunRequest(BaseModel):
    dataset_id: str
    steps: list[PipelineStep] = Field(default_factory=list)


class JobStatus(BaseModel):
    id: str
    status: Literal["queued", "running", "done", "error"]
    progress: float = 0.0
    message: Optional[str] = None
    result: Optional[dict] = None


class AnalysisRequest(BaseModel):
    dataset_id: str
    columns: list[str]
    method: Literal["pearson"] = "pearson"


class CorrelationResult(BaseModel):
    columns: list[str]
    matrix: list[list[float]]


class AnomalyRequest(BaseModel):
    dataset_id: str
    time_col: str
    value_col: str
    contamination: float = 0.05


class AnomalyPoint(BaseModel):
    index: int
    time: str
    value: float
    score: float


class AnomalyResult(BaseModel):
    threshold: float
    points: list[AnomalyPoint]
