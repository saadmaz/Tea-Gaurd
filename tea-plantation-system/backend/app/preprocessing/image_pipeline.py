from io import BytesIO

import numpy as np
from PIL import Image


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    image = Image.open(BytesIO(image_bytes))
    if image.width < 100 or image.height < 100:
        raise ValueError("IMAGE_TOO_SMALL")
    image = image.convert("RGB").resize((416, 416), Image.Resampling.LANCZOS)
    arr = np.asarray(image).astype("float32") / 255.0
    return np.expand_dims(arr, axis=0)
