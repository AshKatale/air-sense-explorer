
export interface Coordinates {
  lat: number;
  lon: number;
}

export interface AirPollutionComponents {
  co: number;    // Carbon monoxide (μg/m3)
  no: number;    // Nitrogen monoxide (μg/m3)
  no2: number;   // Nitrogen dioxide (μg/m3)
  o3: number;    // Ozone (μg/m3)
  so2: number;   // Sulfur dioxide (μg/m3)
  pm2_5: number; // Fine particles (μg/m3)
  pm10: number;  // Coarse particles (μg/m3)
  nh3: number;   // Ammonia (μg/m3)
}

export interface AirQualityData {
  dt: number;                      // Data timestamp in Unix format
  main: { aqi: number };           // Air Quality Index (1-5)
  components: AirPollutionComponents;
}

export interface AirPollutionResponse {
  coord: Coordinates;
  list: AirQualityData[];
}

export interface PollutantThreshold {
  good: number;     // Upper limit for "Good" (AQI 1)
  fair: number;     // Upper limit for "Fair" (AQI 2)
  moderate: number; // Upper limit for "Moderate" (AQI 3)
  poor: number;     // Upper limit for "Poor" (AQI 4)
  // Above "poor" is considered "Very Poor" (AQI 5)
}

export interface PollutantInfo {
  name: string;
  fullName: string;
  unit: string;
  thresholds: PollutantThreshold;
  description: string;
  sources: string[];
  healthEffects: string;
}

export type TimeRange = 'current' | 'forecast' | 'historical';
