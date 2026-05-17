import enum
import uuid

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Index, String, desc, func, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class DetectionType(str, enum.Enum):
    disease_blight = "disease_blight"
    disease_canker = "disease_canker"
    pest_shot_hole = "pest_shot_hole"
    weather = "weather"
    fertilizer = "fertilizer"
    healthy = "healthy"


class Detection(Base):
    __tablename__ = "detections"
    __table_args__ = (
        Index("ix_detections_estate_type_created", "estate_id", "detection_type", desc("created_at")),
        Index("ix_detections_lat_lon", "latitude", "longitude", postgresql_where=text("latitude IS NOT NULL")),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    estate_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("estates.id"), nullable=True)
    detection_type: Mapped[DetectionType] = mapped_column(Enum(DetectionType, name="detection_type"), nullable=False)
    result_label: Mapped[str] = mapped_column(String(255), nullable=False)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    damage_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    image_s3_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    annotated_s3_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    audio_s3_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    metadata_json: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
