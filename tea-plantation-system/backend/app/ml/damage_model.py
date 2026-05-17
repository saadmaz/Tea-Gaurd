from io import BytesIO

import numpy as np
from PIL import Image
from sklearn.cluster import KMeans


def assess_damage(image_bytes: bytes, disease_label: str, mask_model=None):
    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    arr = np.asarray(image)

    if mask_model is not None:
        mask = mask_model.predict(arr)  # pragma: no cover
        plant_pixels = arr[mask > 0]
    else:
        plant_pixels = arr.reshape(-1, 3)

    n_clusters = 10 if disease_label == "tea_blister_blight" else 3
    km = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    labels = km.fit_predict(plant_pixels)
    brightness = km.cluster_centers_.sum(axis=1)
    disease_cluster = int(np.argmin(brightness))
    damage_pct = float((labels == disease_cluster).sum() / len(labels) * 100)

    flat = arr.reshape(-1, 3)
    km_full = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    full_labels = km_full.fit_predict(flat)
    full_brightness = km_full.cluster_centers_.sum(axis=1)
    full_cluster = int(np.argmin(full_brightness))
    flat[full_labels == full_cluster] = [192, 57, 43]
    annotated = Image.fromarray(flat.reshape(arr.shape).astype(np.uint8))

    buffer = BytesIO()
    annotated.save(buffer, format="JPEG")
    return {"damage_pct": damage_pct, "annotated_image_bytes": buffer.getvalue()}
