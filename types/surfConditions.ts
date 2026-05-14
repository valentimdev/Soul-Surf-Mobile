export type SurfQualityLabel = 'BOA' | 'REGULAR' | 'RUIM' | 'INDISPONIVEL';
export type BalneabilityStatus = 'PROPRIA' | 'EM_ALERTA' | 'IMPROPRIA' | 'NAO_ENCONTRADO' | 'INDISPONIVEL';
export type TideStatus = 'ENCHENDO' | 'SECANDO' | 'VIRANDO' | 'INDISPONIVEL';

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

export interface SurfConditionsTideEvent {
  type?: 'ALTA' | 'BAIXA' | string | null;
  dateTime?: string | null;
  timeLabel?: string | null;
  heightMeters?: number | null;
}

export interface SurfConditionsTideWindow {
  startsAt?: string | null;
  endsAt?: string | null;
  label?: string | null;
  score?: number | null;
  activeNow?: boolean | null;
  reason?: string | null;
}

export interface SurfConditionsTide {
  provider?: string | null;
  station?: string | null;
  sourceUrl?: string | null;
  timezone?: string | null;
  updatedAt?: string | null;
  expiresAt?: string | null;
  currentStatus?: TideStatus;
  currentLabel?: string | null;
  currentHeightMeters?: number | null;
  fillPercent?: number | null;
  nextTurnLabel?: string | null;
  previousEvent?: SurfConditionsTideEvent | null;
  nextEvent?: SurfConditionsTideEvent | null;
  nextEvents?: SurfConditionsTideEvent[];
  bestSurfWindows?: SurfConditionsTideWindow[];
  recommendationLabel?: string | null;
  recommendation?: string | null;
  observation?: string | null;
}

export interface SurfConditionsResponse {
  requestedAt?: string | null;
  location?: SurfConditionsLocation;
  marine?: SurfConditionsMarine;
  wind?: SurfConditionsWind;
  surfQuality?: SurfConditionsQuality;
  balneability?: SurfConditionsBalneability;
  tide?: SurfConditionsTide;
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
