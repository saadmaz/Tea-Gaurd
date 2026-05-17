"""initial schema

Revision ID: 0001_init
Revises:
Create Date: 2026-05-17
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '0001_init'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS pgcrypto')

    user_role = sa.Enum('grower', 'manager', 'admin', name='user_role')
    detection_type = sa.Enum('disease_blight', 'disease_canker', 'pest_shot_hole', 'weather', 'fertilizer', 'healthy', name='detection_type')
    user_role.create(op.get_bind(), checkfirst=True)
    detection_type.create(op.get_bind(), checkfirst=True)

    op.create_table('estates',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('district', sa.String(100), nullable=False),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('cultivar_type', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table('users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('full_name', sa.String(255), nullable=False),
        sa.Column('role', user_role, nullable=False, server_default='grower'),
        sa.Column('estate_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('estates.id'), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table('detections',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('estate_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('estates.id'), nullable=True),
        sa.Column('detection_type', detection_type, nullable=False),
        sa.Column('result_label', sa.String(255), nullable=False),
        sa.Column('confidence', sa.Float(), nullable=True),
        sa.Column('damage_pct', sa.Float(), nullable=True),
        sa.Column('image_s3_key', sa.String(500), nullable=True),
        sa.Column('annotated_s3_key', sa.String(500), nullable=True),
        sa.Column('audio_s3_key', sa.String(500), nullable=True),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('metadata', postgresql.JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table('sensor_readings',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('estate_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('estates.id'), nullable=True),
        sa.Column('device_id', sa.String(100), nullable=False),
        sa.Column('nitrogen', sa.Float(), nullable=True),
        sa.Column('phosphorus', sa.Float(), nullable=True),
        sa.Column('potassium', sa.Float(), nullable=True),
        sa.Column('ph_level', sa.Float(), nullable=True),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table('fertilizer_recommendations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('sensor_reading_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('sensor_readings.id'), nullable=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('weather_condition', sa.String(100), nullable=True),
        sa.Column('fertilizer_type', sa.String(100), nullable=False),
        sa.Column('quantity_kg_ha', sa.Float(), nullable=False),
        sa.Column('application_safe', sa.Boolean(), nullable=False),
        sa.Column('recommended_date', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table('audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('action', sa.String(255), nullable=False),
        sa.Column('endpoint', sa.String(255), nullable=True),
        sa.Column('ip_address', sa.String(50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_index('ix_detections_estate_type_created', 'detections', ['estate_id', 'detection_type', 'created_at'])
    op.create_index('ix_detections_lat_lon', 'detections', ['latitude', 'longitude'], postgresql_where=sa.text('latitude IS NOT NULL'))
    op.create_index('ix_sensor_estate_created', 'sensor_readings', ['estate_id', 'created_at'])


def downgrade() -> None:
    op.drop_index('ix_sensor_estate_created', table_name='sensor_readings')
    op.drop_index('ix_detections_lat_lon', table_name='detections')
    op.drop_index('ix_detections_estate_type_created', table_name='detections')
    op.drop_table('audit_logs')
    op.drop_table('fertilizer_recommendations')
    op.drop_table('sensor_readings')
    op.drop_table('detections')
    op.drop_table('users')
    op.drop_table('estates')
    sa.Enum(name='detection_type').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='user_role').drop(op.get_bind(), checkfirst=True)
