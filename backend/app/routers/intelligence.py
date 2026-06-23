from fastapi import APIRouter

from app.schemas.intelligence import (
    CognitiveContext,
    CognitivePredictionResponse,
    MentorRequest,
    MentorResponse,
)
from app.services.intelligence_engine import build_mentor_response, predict_cognitive_state

router = APIRouter(prefix="/intelligence", tags=["intelligence"])


def _predict(body: CognitiveContext):
    return predict_cognitive_state(
        body.usage.model_dump(),
        app_switches=body.app_switches,
        late_night_minutes=body.late_night_minutes,
        deep_work_minutes=body.deep_work_minutes,
        launch_count=body.launch_count,
    )


@router.post("/predict", response_model=CognitivePredictionResponse)
def predict(body: CognitiveContext) -> dict:
    return _predict(body).to_dict()


@router.post("/chat", response_model=MentorResponse)
def chat(body: MentorRequest) -> dict:
    result = _predict(body.context)
    return build_mentor_response(
        body.question,
        result,
        [entry.model_dump() for entry in body.recent_history],
    )
