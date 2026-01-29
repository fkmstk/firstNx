import io
import time

from fastapi.testclient import TestClient

from app.main import app
from app.settings import settings
from app import storage


client = TestClient(app)


def setup_function() -> None:
    storage.datasets.clear()


def upload_csv(tmp_path):
    settings.data_dir = str(tmp_path)
    storage.ensure_data_dir()
    content = "time,value,other\n" + "\n".join(
        f"2024-01-01T00:00:{i:02d},{i},{i*2}" for i in range(1, 11)
    )
    file_obj = io.BytesIO(content.encode("utf-8"))
    response = client.post(
        "/api/upload",
        files={"file": ("sample.csv", file_obj, "text/csv")},
    )
    assert response.status_code == 200
    return response.json()


def wait_for_job(job_id: str):
    for _ in range(50):
        res = client.get(f"/api/jobs/{job_id}")
        assert res.status_code == 200
        data = res.json()
        if data["status"] == "done":
            return data
        if data["status"] == "error":
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
    dataset = upload_csv(tmp_path)
    request = {
        "dataset_id": dataset["id"],
        "steps": [
            {"type": "select", "columns": ["time", "value"]}
        ],
    }
    res = client.post("/api/pipeline/run", json=request)
    assert res.status_code == 200
    job = res.json()
    wait_for_job(job["id"])

    preview = client.get(f"/api/jobs/{job['id']}/result/preview")
    assert preview.status_code == 200


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
