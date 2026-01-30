import os
import socket

import uvicorn

from app.main import app as fastapi_app


def _find_free_port(host: str, preferred: int, max_tries: int = 100) -> int:
    if preferred < 0 or preferred > 65535:
        raise ValueError("preferred port must be between 0 and 65535")
    last_port = min(65535, preferred + max_tries)
    ports = range(preferred, last_port + 1)
    last_error: OSError | None = None
    for port in ports:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
                sock.bind((host, port))
            return port
        except OSError as exc:
            last_error = exc
    raise RuntimeError(
        f"No free port available in range {preferred}-{preferred + max_tries} on {host}"
    ) from last_error


def main() -> None:
    host = os.getenv("FIRSTNX_HOST", "127.0.0.1")
    port_raw = os.getenv("FIRSTNX_PORT")
    if port_raw:
        try:
            port = int(port_raw)
        except ValueError as exc:
            raise RuntimeError("FIRSTNX_PORT must be an integer") from exc
    else:
        port = _find_free_port(host, 8000, 100)
    os.environ.setdefault("FIRSTNX_HOST", host)
    os.environ["FIRSTNX_PORT"] = str(port)
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
