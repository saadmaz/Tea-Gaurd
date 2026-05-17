from app.ml.disease_model import predict_disease


def run_disease_detection(model, image_array):
    return predict_disease(model, image_array)
