"""Image segmentation post-processing. Runs locally; inputs never leave the configured host."""
from __future__ import annotations

from io import BytesIO
from PIL import Image
import numpy as np
from scipy import ndimage


def image_hash(image: Image.Image) -> str:
    """64-bit difference hash; similar crops have a small Hamming distance."""
    grayscale = np.asarray(image.convert("L").resize((9, 8)), dtype=np.int16)
    bits = (grayscale[:, 1:] > grayscale[:, :-1]).flatten()
    value = sum(int(bit) << index for index, bit in enumerate(bits))
    return f"{value:016x}"


def distance(first: str, second: str) -> int:
    return (int(first, 16) ^ int(second, 16)).bit_count()


def split_masked(image: Image.Image, min_pixels: int = 1800, max_parts: int = 12) -> list[tuple[Image.Image, tuple[int, int, int, int], str]]:
    """Return disjoint foreground components, preserving transparency per piece."""
    image = image.convert("RGBA")
    rgba = np.array(image)
    foreground = rgba[:, :, 3] > 40
    labels, count = ndimage.label(foreground, structure=np.ones((3, 3), dtype=np.uint8))
    sizes = np.bincount(labels.flatten())
    components = sorted((label for label in range(1, count + 1) if sizes[label] >= min_pixels), key=lambda label: -sizes[label])[:max_parts]
    result = []
    for label in components:
        ys, xs = np.where(labels == label)
        box = (max(0, int(xs.min()) - 8), max(0, int(ys.min()) - 8), min(image.width, int(xs.max()) + 9), min(image.height, int(ys.max()) + 9))
        crop = rgba[box[1]:box[3], box[0]:box[2]].copy()
        crop[:, :, 3] = np.where(labels[box[1]:box[3], box[0]:box[2]] == label, crop[:, :, 3], 0)
        part = Image.fromarray(crop, "RGBA")
        result.append((part, box, image_hash(part)))
    return sorted(result, key=lambda part: (part[1][1], part[1][0]))


def encode_png(image: Image.Image) -> bytes:
    buffer = BytesIO()
    image.save(buffer, format="PNG", optimize=True)
    return buffer.getvalue()

