"""Private, self-hostable garment cutout/splitting service. No paid API calls."""
from __future__ import annotations

import base64
import os
from io import BytesIO
from urllib.parse import urlparse
from urllib.request import HTTPRedirectHandler, build_opener

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
from PIL import Image, ImageOps
from rembg import remove, new_session

from core import encode_png, split_masked

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
_session = None
MAX_INPUT_BYTES = 8_000_000


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise ValueError("Redirected image URLs are not allowed")


class ProcessRequest(BaseModel):
    image_url: str
    max_parts: int = 12


@app.post("/process")
def process(body: ProcessRequest, authorization: str | None = Header(default=None)):
    if not os.getenv("VISION_TOKEN") or authorization != f"Bearer {os.environ['VISION_TOKEN']}":
        raise HTTPException(401, "Unauthorized")
    url = urlparse(body.image_url)
    allowed_host = os.getenv("SUPABASE_STORAGE_HOST", "")
    if url.scheme != "https" or not allowed_host or url.hostname != allowed_host or url.port is not None:
        raise HTTPException(400, "Invalid image host")
    if not 1 <= body.max_parts <= 12:
        raise HTTPException(400, "Invalid part count")
    try:
        with build_opener(NoRedirect()).open(body.image_url, timeout=20) as response:
            raw = response.read(MAX_INPUT_BYTES + 1)
        if len(raw) > MAX_INPUT_BYTES:
            raise HTTPException(413, "Image too large")
        source = ImageOps.exif_transpose(Image.open(BytesIO(raw))).convert("RGBA")
        if source.width * source.height > 12_000_000:
            raise HTTPException(413, "Image dimensions too large")
        global _session
        if _session is None:
            _session = new_session(os.getenv("REMBG_MODEL", "u2netp"))
        masked = remove(source, session=_session).convert("RGBA")
        parts = split_masked(masked, max_parts=body.max_parts)
        if not parts:
            raise HTTPException(422, "No distinct garments found")
        return {"parts": [{"png_base64": base64.b64encode(encode_png(image)).decode("ascii"), "box": box, "hash": fingerprint} for image, box, fingerprint in parts], "needs_review": True}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(422, "Image processing failed")

