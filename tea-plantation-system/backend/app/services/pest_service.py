from app.ml.pest_model import predict_pest


def run_pest_detection(model, audio_array):
    return predict_pest(model, audio_array)
