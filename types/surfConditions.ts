export type SurfQualityLabel = 'BOA' | 'REGULAR' | 'RUIM' | 'INDISPONIVEL';
export type BalneabilityStatus = 'PROPRIA' | 'EM_ALERTA' | 'IMPROPRIA' | 'NAO_ENCONTRADO' | 'INDISPONIVEL';

export interface SurfConditionsLocation {
  latitude?: number | null;
  longitude?: number | null;
  timezone?: string | null;
}

export interface SurfConditionsMarine {
  waveHeightMeters?: number | null;
  waveDirectionDegrees?: number | null;
  wavePeriodSeconds?: number | null;
  seaSurfaceTemperatureC?: number | null;
  oceanCurrentVelocityKmh?: number | null;
  oceanCurrentDirectionDegrees?: number | null;
}

export interface SurfConditionsWind {
  windSpeedKmh?: number | null;
  windDirectionDegrees?: number | null;
  windGustKmh?: number | null;
  weatherCode?: number | null;
}

export interface SurfConditionsQuality {
  label?: SurfQualityLabel;
  score?: number | null;
  reasons?: string[];
}

export interface SurfConditionsBalneabilityPoint {
  pointCode?: string | null;
  description?: string | null;
  status?: string | null;
}

export interface SurfConditionsBalneability {
  provider?: string | null;
  reportUrl?: string | null;
  period?: string | null;
  beachQuery?: string | null;
  overallStatus?: BalneabilityStatus;
  totalPoints?: number | null;
  properPoints?: number | null;
  alertPoints?: number | null;
  improperPoints?: number | null;
  matchedPoints?: SurfConditionsBalneabilityPoint[];
  observation?: string | null;
}

export interface SurfConditionsResponse {
  requestedAt?: string | null;
  location?: SurfConditionsLocation;
  marine?: SurfConditionsMarine;
  wind?: SurfConditionsWind;
  surfQuality?: SurfConditionsQuality;
  balneability?: SurfConditionsBalneability;
  sources?: string[];
}

export interface SurfConditionsRequestParams {
  lat: number;
  lon: number;
  beach?: string;
}

export type LaymanTone = 'good' | 'attention' | 'bad' | 'neutral';

export interface LaymanSummary {
  title: string;
  message: string;
  tone: LaymanTone;
}
