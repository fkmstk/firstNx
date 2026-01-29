import io
import time

from fastapi.testclient import TestClient

from app.main import app
from app.settings import settings
from app import storage


client = TestClient(app)


def setup_function() -> None:
    storage.datasets.clear()


def build_csv(header, rows):
    lines = [",".join(header)]
    for row in rows:
        values = []
        for value in row:
            if value is None:
                values.append("")
            else:
                values.append(str(value))
        lines.append(",".join(values))
    return "\n".join(lines)


def upload_csv(tmp_path, header=None, rows=None, filename="sample.csv"):
    settings.data_dir = str(tmp_path)
    storage.ensure_data_dir()
    if header is None:
        header = ["time", "value", "other"]
    if rows is None:
        rows = [
            [f"2024-01-01T00:00:{i:02d}", i, i * 2]
            for i in range(1, 11)
        ]
    content = build_csv(header, rows)
    file_obj = io.BytesIO(content.encode("utf-8"))
    response = client.post(
        "/api/upload",
        files={"file": (filename, file_obj, "text/csv")},
    )
    assert response.status_code == 200
    return response.json()


def wait_for_job(job_id: str, expect_error: bool = False):
    for _ in range(50):
        res = client.get(f"/api/jobs/{job_id}")
        assert res.status_code == 200
        data = res.json()
        if data["status"] == "done":
            return data
        if data["status"] == "error":
            if expect_error:
                return data
            raise AssertionError(data.get("message"))
        time.sleep(0.1)
    raise AssertionError("Job did not finish in time")


def test_upload_preview(tmp_path):
    dataset = upload_csv(tmp_path)
    preview = client.get(f"/api/datasets/{dataset['id']}/preview")
    assert preview.status_code == 200
    payload = preview.json()
    assert "columns" in payload
    assert len(payload["rows"]) > 0


def test_pipeline_run(tmp_path):
    left_rows = [
        ["2024-01-01T00:00:01", 1, 2],
        ["2024-01-01T00:00:02", None, 4],
        ["2024-01-01T00:00:03", 3, 6],
        ["2024-01-01T00:00:04", 4, 8],
        ["2024-01-01T00:00:05", 5, 10],
    ]
    right_rows = [
        ["2024-01-01T00:00:01", 10],
        ["2024-01-01T00:00:02", 20],
        ["2024-01-01T00:00:03", 30],
        ["2024-01-01T00:00:04", 40],
        ["2024-01-01T00:00:05", 50],
    ]
    dataset = upload_csv(tmp_path, rows=left_rows)
    right = upload_csv(
        tmp_path,
        header=["time", "right_value"],
        rows=right_rows,
        filename="right.csv",
    )
    request = {
        "dataset_id": dataset["id"],
        "steps": [
            {"type": "impute", "column": "value", "method": "mean"},
            {"type": "filter", "expr": "value >= 3"},
            {"type": "select", "columns": ["time", "value"]},
            {
                "type": "join",
                "left_id": None,
                "right_id": right["id"],
                "left_time_col": "time",
                "right_time_col": "time",
                "strategy": "nearest",
                "tolerance_ms": 1000,
            },
        ],
    }
    res = client.post("/api/pipeline/run", json=request)
    assert res.status_code == 200
    job = res.json()
    wait_for_job(job["id"])

    preview = client.get(f"/api/jobs/{job['id']}/result/preview")
    assert preview.status_code == 200
    preview_data = preview.json()
    assert "right_value" in preview_data["columns"]


def test_preview_not_found(tmp_path):
    settings.data_dir = str(tmp_path)
    storage.ensure_data_dir()
    preview = client.get("/api/datasets/missing/preview")
    assert preview.status_code == 404


def test_analysis(tmp_path):
    dataset = upload_csv(tmp_path)
    corr = client.post(
        "/api/analysis/correlation",
        json={"dataset_id": dataset["id"], "columns": ["value", "other"]},
    )
    assert corr.status_code == 200
    corr_data = corr.json()
    assert "matrix" in corr_data

    anomaly = client.post(
        "/api/analysis/anomaly",
        json={
            "dataset_id": dataset["id"],
            "time_col": "time",
            "value_col": "value",
            "contamination": 0.2,
        },
    )
    assert anomaly.status_code == 200
    anomaly_data = anomaly.json()
    assert "points" in anomaly_data


def test_pipeline_error(tmp_path):
    dataset = upload_csv(tmp_path)
    request = {
        "dataset_id": dataset["id"],
        "steps": [
            {"type": "filter", "expr": "value >> 3"},
        ],
    }
    res = client.post("/api/pipeline/run", json=request)
    assert res.status_code == 200
    job = res.json()
    result = wait_for_job(job["id"], expect_error=True)
    assert result["status"] == "error"
