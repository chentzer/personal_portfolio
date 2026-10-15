# Local preview server that disables caching, so edited ES modules always reload.
# Dev-only extra: POST /__save/<name>.jpg writes a JPEG into assets/ (used to render the link-preview image).
import functools
import http.server
import os
import re
import sys

port = int(sys.argv[1])
root = sys.argv[2]


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_POST(self):
        m = re.fullmatch(r"/__save/([a-z0-9-]+\.jpg)", self.path)
        length = int(self.headers.get("Content-Length", 0))
        if not m or length > 5_000_000 or self.client_address[0] != "127.0.0.1":
            self.send_error(400)
            return
        data = self.rfile.read(length)
        if not data.startswith(b"\xff\xd8\xff"):
            self.send_error(400)
            return
        with open(os.path.join(root, "assets", m.group(1)), "wb") as f:
            f.write(data)
        self.send_response(204)
        self.end_headers()


handler = functools.partial(NoCacheHandler, directory=root)
http.server.ThreadingHTTPServer(("127.0.0.1", port), handler).serve_forever()
