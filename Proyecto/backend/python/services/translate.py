import boto3

from config import Config
from utils.http import ApiError

# Sin llaves: en la EC2 usa el rol Semi-EC2-AppRole
_client = boto3.client("translate", region_name=Config.AWS_REGION)


def translate_text(text, target_lang):
    """El idioma de origen lo detecta Translate ("auto"), para eso el rol necesita
    comprehend:DetectDominantLanguage."""
    try:
        result = _client.translate_text(Text=text, SourceLanguageCode="auto", TargetLanguageCode=target_lang)
    except Exception as e:
        print("[translate] TranslateText:", e)
        raise ApiError(502, "UPSTREAM_ERROR", "No se pudo traducir el texto")

    return {
        "translatedText": result.get("TranslatedText", ""),
        "sourceLang": result.get("SourceLanguageCode", ""),
    }
