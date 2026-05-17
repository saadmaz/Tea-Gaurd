export type UserRole = 'grower' | 'manager' | 'admin';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  estate_id: string;
}

export interface Estate {
  id: string;
  name: string;
  district: string;
  latitude: number;
  longitude: number;
  cultivar_type?: string;
}

export type DetectionType =
  | 'disease_blight'
  | 'disease_canker'
  | 'pest_shot_hole'
  | 'weather'
  | 'fertilizer'
  | 'healthy';

export interface DetectionRecord {
  id: string;
  user_id: string;
  estate_id: string;
  detection_type: DetectionType;
  result_label: string;
  confidence?: number;
  damage_pct?: number;
  image_s3_key?: string;
  annotated_s3_key?: string;
  audio_s3_key?: string;
  latitude?: number;
  longitude?: number;
  metadata?: Record<string, any>;
  created_at: string;
  annotated_image_url?: string;
}

export interface SensorReading {
  id: string;
  estate_id: string;
  device_id: string;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  ph_level: number;
  latitude?: number;
  longitude?: number;
  created_at: string;
}

export interface WeatherResult {
  weather_category: string;
  rain_warning: boolean;
  raw_params: {
    precipitation: number;
    temp_max: number;
    temp_min: number;
    humidity_day: number;
    humidity_night: number;
    wind_speed: number;
  };
  fertilizer_safe: boolean;
}

export interface FertilizerResult {
  application_safe: boolean;
  fertilizer_type: string;
  quantity_kg_ha: number;
  weather_condition: string;
  reasoning: {
    nitrogen_status: 'low' | 'optimal' | 'high';
    phosphorus_status: 'low' | 'optimal' | 'high';
    potassium_status: 'low' | 'optimal' | 'high';
    ph_status: string;
    weather_factor: string;
  };
}

export interface DiseaseResult {
  label: string;
  confidence: number;
  is_diseased: boolean;
  damage_pct?: number;
  annotated_image_url?: string;
  gps_marker_id: string;
}

export interface PestResult {
  label: 'infested' | 'not_infested';
  confidence: number;
  gps_marker_id: string;
  recommendation: string;
}

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  detection_type: string;
  label: string;
  damage_pct?: number;
  created_at: string;
  marker_color: 'red' | 'orange' | 'green';
}

export interface ApiEnvelope<T> {
  status: 'success' | 'error';
  data: T | null;
  error: { code: string; message: string } | null;
  timestamp: string;
}
