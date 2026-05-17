from app.ml.damage_model import assess_damage


def run_damage_assessment(image_bytes, disease_label, mask_model=None) -> dict:
    return assess_damage(image_bytes, disease_label, mask_model)
