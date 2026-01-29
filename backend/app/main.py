from __future__ import annotations

import os
import shutil
import uuid
from typing import Any

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from .analysis import compute_correlation, detect_anomalies
from .etl import preview_csv, run_pipeline
from .jobs import create_job, get_job, start_job
from .models import (
    AnalysisRequest,
    AnomalyRequest,
    DatasetMeta,
    DatasetMetaPublic,
    JobStatus,
    PipelineRunRequest,
)
from .settings import settings
from .storage import add_dataset, ensure_data_dir, get_dataset, list_datasets


app = FastAPI(title="ETL Tool API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def _to_public(meta: DatasetMeta) -> DatasetMetaPublic:
    return DatasetMetaPublic(
        id=meta.id,
        filename=meta.filename,
        row_count=meta.row_count,
        columns=meta.columns,
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/upload", response_model=DatasetMetaPublic)
def upload_csv(file: UploadFile = File(...)) -> DatasetMetaPublic:
    if not file.filename:
        raise HTTPException(status_code=400, detail="ファイル名が不正です")
    ensure_data_dir()
    filename = file.filename
    ext = os.path.splitext(filename)[1] or ".csv"
    stored_name = f"{uuid.uuid4().hex}{ext}"
    path = os.path.join(settings.data_dir, stored_name)
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return _to_public(add_dataset(filename, path))


@app.get("/api/datasets", response_model=list[DatasetMetaPublic])
def get_datasets() -> list[DatasetMetaPublic]:
    return [_to_public(meta) for meta in list_datasets()]


@app.get("/api/datasets/{dataset_id}/preview")
def dataset_preview(dataset_id: str, limit: int = Query(None)) -> dict[str, Any]:
    dataset = get_dataset(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    preview_limit = limit or settings.preview_limit
    return preview_csv(dataset.path, preview_limit)


@app.post("/api/pipeline/run", response_model=JobStatus)
def pipeline_run(request: PipelineRunRequest) -> JobStatus:
    dataset = get_dataset(request.dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    job = create_job()
    ensure_data_dir()
    result_path = os.path.join(settings.data_dir, f"{job.id}_result.csv")

    def dataset_lookup(dataset_id: str) -> str:
        meta = get_dataset(dataset_id)
        if not meta:
            raise ValueError(f"Dataset not found: {dataset_id}")
        return meta.path

    def runner(progress_cb):
        return run_pipeline(
            dataset.path,
            request.steps,
            dataset_lookup,
            result_path,
            progress_cb,
        )

    start_job(job.id, runner)
    return job


@app.get("/api/jobs/{job_id}", response_model=JobStatus)
def job_status(job_id: str) -> JobStatus:
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@app.get("/api/jobs/{job_id}/result/preview")
def job_result_preview(job_id: str, limit: int = Query(None)) -> dict[str, Any]:
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status != "done" or not job.result:
        raise HTTPException(status_code=400, detail="Job not completed")
    result_path = job.result.get("result_path")
    if not result_path:
        raise HTTPException(status_code=400, detail="Result not available")
    preview_limit = limit or settings.preview_limit
    return preview_csv(result_path, preview_limit)


@app.get("/api/jobs/{job_id}/result/download")
def job_result_download(job_id: str) -> FileResponse:
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status != "done" or not job.result:
        raise HTTPException(status_code=400, detail="Job not completed")
    result_path = job.result.get("result_path")
    if not result_path or not os.path.exists(result_path):
        raise HTTPException(status_code=404, detail="Result not found")
    return FileResponse(result_path, filename=os.path.basename(result_path))


@app.post("/api/analysis/correlation")
def correlation(request: AnalysisRequest) -> dict[str, Any]:
    dataset = get_dataset(request.dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return compute_correlation(dataset.path, request.columns)


@app.post("/api/analysis/anomaly")
def anomaly(request: AnomalyRequest) -> dict[str, Any]:
    dataset = get_dataset(request.dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return detect_anomalies(
        dataset.path,
        request.time_col,
        request.value_col,
        request.contamination,
    )
