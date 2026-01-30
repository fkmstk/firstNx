import socket

from app.run_server import _find_free_port


HOST = "127.0.0.1"


def _reserve_port_with_room(room: int = 5):
    for _ in range(50):
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.bind((HOST, 0))
        port = sock.getsockname()[1]
        if port <= 65535 - room:
            return sock, port
        sock.close()
    raise RuntimeError("Could not reserve port with required room")


def test_find_free_port_returns_bindable_port():
    sock, port = _reserve_port_with_room(room=5)
    max_tries = min(5, 65535 - port)
    sock.close()

    chosen = _find_free_port(HOST, port, max_tries)

    assert port <= chosen <= port + max_tries
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as check:
        check.bind((HOST, chosen))


def test_find_free_port_skips_in_use_port():
    sock, port = _reserve_port_with_room(room=5)
    max_tries = min(5, 65535 - port)

    chosen = _find_free_port(HOST, port, max_tries)

    assert chosen != port
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as check:
        check.bind((HOST, chosen))
    sock.close()
