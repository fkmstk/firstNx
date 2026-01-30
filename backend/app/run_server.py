import os

import uvicorn


def main() -> None:
    host = os.getenv("FIRSTNX_HOST", "127.0.0.1")
    port = int(os.getenv("FIRSTNX_PORT", "8000"))
    os.environ.setdefault("FIRSTNX_HOST", host)
    os.environ.setdefault("FIRSTNX_PORT", str(port))
    os.environ.setdefault("FIRSTNX_OPEN_BROWSER", "1")
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        log_level="info",
        reload=False,
    )


if __name__ == "__main__":
    main()
