from __future__ import annotations

import threading
import uuid
from typing import Callable, Dict, Optional

from .models import JobStatus


JobRunner = Callable[[Callable[[float, Optional[str]], None]], dict]

_jobs: Dict[str, JobStatus] = {}
_lock = threading.Lock()


def create_job() -> JobStatus:
    job_id = uuid.uuid4().hex
    job = JobStatus(id=job_id, status="queued", progress=0.0)
    with _lock:
        _jobs[job_id] = job
    return job


def get_job(job_id: str) -> JobStatus | None:
    with _lock:
        return _jobs.get(job_id)


def _update_job(job_id: str, *, status: str | None = None, progress: float | None = None,
                message: Optional[str] = None, result: dict | None = None) -> None:
    with _lock:
        job = _jobs.get(job_id)
        if not job:
            return
        if status is not None:
            job.status = status  # type: ignore[assignment]
        if progress is not None:
            job.progress = progress
        if message is not None:
            job.message = message
        if result is not None:
            job.result = result


def start_job(job_id: str, runner: JobRunner) -> None:
    def _run() -> None:
        try:
            _update_job(job_id, status="running", progress=0.05, message="処理を開始しました")

            def progress_cb(p: float, msg: Optional[str] = None) -> None:
                _update_job(job_id, progress=p, message=msg)

            result = runner(progress_cb)
            _update_job(job_id, status="done", progress=1.0, message="完了", result=result)
        except Exception as exc:  # noqa: BLE001
            _update_job(job_id, status="error", progress=1.0, message=str(exc))

    thread = threading.Thread(target=_run, daemon=True)
    thread.start()
