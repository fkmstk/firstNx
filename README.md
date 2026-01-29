# firstNx ETL Tool

社内向けのローカルETLツール（React + FastAPI）。

## 構成
- `frontend/`: Vite + React (TypeScript)
- `backend/`: FastAPI + Polars
- `data/`: アップロードCSVの一時保存

## 起動手順

### Backend
```bash
cd backend
uv venv
uv pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
pnpm install
pnpm dev
```

- フロント: http://localhost:5173
- バック: http://localhost:8000

## 主要機能（MVP）
- CSVアップロード & プレビュー
- 時系列結合 / 欠損処理 / フィルタ / 列選択
- 相関 / 異常検知
- 時系列散布図の可視化
