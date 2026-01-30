import os

import uvicorn

from app.main import app as fastapi_app


def main() -> None:
    host = os.getenv("FIRSTNX_HOST", "127.0.0.1")
    port = int(os.getenv("FIRSTNX_PORT", "8000"))
    os.environ.setdefault("FIRSTNX_HOST", host)
    os.environ.setdefault("FIRSTNX_PORT", str(port))
    os.environ.setdefault("FIRSTNX_OPEN_BROWSER", "1")
    uvicorn.run(
        fastapi_app,
        host=host,
        port=port,
        log_level="info",
        reload=False,
    )


if __name__ == "__main__":
    main()
