
import { AirPollutionResponse, PollutantInfo, TimeRange } from '@/types/airQuality';
import { toast } from "sonner";

// We'll use a temporary API key for development
// In production, this should be handled securely
let API_KEY = '';

export const setApiKey = (key: string) => {
  API_KEY = key;
  localStorage.setItem('openweather_api_key', key);
  return isValidApiKey();
};

export const getApiKey = (): string => {
  if (API_KEY) return API_KEY;
  const savedKey = localStorage.getItem('openweather_api_key');
  if (savedKey) API_KEY = savedKey;
  return API_KEY;
};

export const isValidApiKey = async (): Promise<boolean> => {
  const key = getApiKey();
  if (!key) return false;
  
  try {
    // Test the API key with a simple request
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=51.5074&lon=-0.1278&appid=${key}`
    );
    
    if (!response.ok) {
      if (response.status === 401) {
        toast.error("Invalid API key. Please check your API key and try again.");
        return false;
      }
      throw new Error(`Error validating API key: ${response.statusText}`);
    }
    
    return true;
  } catch (error) {
    console.error("Error validating API key:", error);
    return false;
  }
};

export const fetchAirQualityData = async (
  lat: number, 
  lon: number, 
  timeRange: TimeRange = 'current',
  startTime?: number, 
  endTime?: number
): Promise<AirPollutionResponse | null> => {
  const key = getApiKey();
  if (!key) {
    toast.error("API key not set. Please set your OpenWeather API key.");
    return null;
  }
  
  let url = '';
  switch (timeRange) {
    case 'current':
      url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${key}`;
      break;
    case 'forecast':
      url = `https://api.openweathermap.org/data/2.5/air_pollution/forecast?lat=${lat}&lon=${lon}&appid=${key}`;
      break;
    case 'historical':
      if (!startTime || !endTime) {
        toast.error("Start and end times are required for historical data");
        return null;
      }
      url = `https://api.openweathermap.org/data/2.5/air_pollution/history?lat=${lat}&lon=${lon}&start=${startTime}&end=${endTime}&appid=${key}`;
      break;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error fetching ${timeRange} data: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${timeRange} air quality data:`, error);
    toast.error(`Failed to fetch ${timeRange} air quality data. Please try again.`);
    return null;
  }
};

// Pollutant information database with thresholds
export const pollutantInfo: Record<string, PollutantInfo> = {
  co: {
    name: 'CO',
    fullName: 'Carbon Monoxide',
    unit: 'μg/m³',
    thresholds: { good: 4400, fair: 9400, moderate: 12400, poor: 15400 },
    description: 'Colorless, odorless gas produced by burning carbon-based fuels',
    sources: ['Vehicle exhaust', 'Industrial processes', 'Combustion of fossil fuels'],
    healthEffects: 'Reduces oxygen delivery to body organs, can cause headache, dizziness, and at high levels, death.'
  },
  no: {
    name: 'NO',
    fullName: 'Nitrogen Monoxide',
    unit: 'μg/m³',
    thresholds: { good: 40, fair: 70, moderate: 150, poor: 200 },
    description: 'Reactive gas formed during combustion',
    sources: ['Vehicle emissions', 'Power plants', 'Industrial processes'],
    healthEffects: 'Contributes to respiratory problems, can form particulate matter and ozone.'
  },
  no2: {
    name: 'NO₂',
    fullName: 'Nitrogen Dioxide',
    unit: 'μg/m³',
    thresholds: { good: 40, fair: 70, moderate: 150, poor: 200 },
    description: 'Reddish-brown gas with a sharp, harsh odor',
    sources: ['Vehicles', 'Power plants', 'Industrial emissions'],
    healthEffects: 'Causes inflammation of airways, reduced lung function, increased asthma attacks.'
  },
  o3: {
    name: 'O₃',
    fullName: 'Ozone',
    unit: 'μg/m³',
    thresholds: { good: 60, fair: 100, moderate: 140, poor: 180 },
    description: 'Pale blue gas with a distinctive smell',
    sources: ['Formed from NOx and VOCs in sunlight', 'Vehicle emissions', 'Industrial emissions'],
    healthEffects: 'Irritates airways, reduces lung function, worsens asthma and chronic bronchitis.'
  },
  so2: {
    name: 'SO₂',
    fullName: 'Sulfur Dioxide',
    unit: 'μg/m³',
    thresholds: { good: 20, fair: 80, moderate: 250, poor: 350 },
    description: 'Colorless gas with a pungent odor',
    sources: ['Coal and oil burning', 'Industrial processes', 'Volcanoes'],
    healthEffects: 'Irritates nose, throat, and airways, causing coughing and wheezing. Can worsen asthma and chronic bronchitis.'
  },
  pm2_5: {
    name: 'PM2.5',
    fullName: 'Fine Particulate Matter',
    unit: 'μg/m³',
    thresholds: { good: 10, fair: 25, moderate: 50, poor: 75 },
    description: 'Tiny particles less than 2.5 micrometers in diameter',
    sources: ['Combustion engines', 'Power plants', 'Construction', 'Agricultural burning', 'Forest fires'],
    healthEffects: 'Can penetrate deep into lungs and bloodstream, leading to heart and lung disease, reduced lung function, and premature death.'
  },
  pm10: {
    name: 'PM10',
    fullName: 'Coarse Particulate Matter',
    unit: 'μg/m³',
    thresholds: { good: 20, fair: 50, moderate: 100, poor: 200 },
    description: 'Particles less than 10 micrometers in diameter',
    sources: ['Dust from construction', 'Road dust', 'Agricultural operations', 'Industrial processes'],
    healthEffects: 'Can irritate eyes, nose, and throat, worsen asthma and bronchitis.'
  },
  nh3: {
    name: 'NH₃',
    fullName: 'Ammonia',
    unit: 'μg/m³', 
    // Note: OpenWeather does not provide specific thresholds for NH3
    thresholds: { good: 20, fair: 50, moderate: 100, poor: 200 },
    description: 'Colorless gas with a distinct pungent smell',
    sources: ['Agricultural activities', 'Livestock waste', 'Fertilizer application'],
    healthEffects: 'Irritates respiratory system, eyes, and skin. Can form secondary particulate matter.'
  }
};

// Determine AQI category based on level (1-5)
export const getAQICategory = (aqi: number): string => {
  switch (aqi) {
    case 1: return 'Good';
    case 2: return 'Fair';
    case 3: return 'Moderate';
    case 4: return 'Poor';
    case 5: return 'Very Poor';
    default: return 'Unknown';
  }
};

// Get class for AQI level
export const getAQIColorClass = (aqi: number): string => {
  switch (aqi) {
    case 1: return 'bg-aqi-good text-gray-900';
    case 2: return 'bg-aqi-fair text-gray-900';
    case 3: return 'bg-aqi-moderate text-gray-900';
    case 4: return 'bg-aqi-poor text-white';
    case 5: return 'bg-aqi-verypoor text-white';
    default: return 'bg-gray-300';
  }
};

// Analyzes pollutant levels to determine potential sources and health impacts
export const analyzePollutants = (components: Record<string, number>): {
  significantPollutants: string[];
  potentialSources: string[];
  healthImplications: string;
} => {
  let significantPollutants: string[] = [];
  let potentialSources = new Set<string>();
  let highestAQI = 1;
  
  // Determine significant pollutants (those above "fair" thresholds)
  for (const [key, value] of Object.entries(components)) {
    // Skip keys that aren't in our pollutant info
    if (!pollutantInfo[key]) continue;
    
    const info = pollutantInfo[key];
    let pollutantAQI = 1;
    
    // Determine AQI level for this pollutant
    if (value > info.thresholds.poor) {
      pollutantAQI = 5;
    } else if (value > info.thresholds.moderate) {
      pollutantAQI = 4;
    } else if (value > info.thresholds.fair) {
      pollutantAQI = 3;
    } else if (value > info.thresholds.good) {
      pollutantAQI = 2;
    }
    
    if (pollutantAQI > 2) {
      significantPollutants.push(info.name);
      
      // Add sources for this pollutant
      info.sources.forEach(source => potentialSources.add(source));
      
      // Track highest AQI
      if (pollutantAQI > highestAQI) {
        highestAQI = pollutantAQI;
      }
    }
  }
  
  // Generate health implications based on highest AQI
  let healthImplications = '';
  switch (highestAQI) {
    case 1:
      healthImplications = 'Air quality is satisfactory, poses little or no health risk.';
      break;
    case 2:
      healthImplications = 'Air quality is acceptable. Some pollutants may be a concern for very sensitive individuals.';
      break;
    case 3:
      healthImplications = 'Members of sensitive groups may experience health effects. General public is less likely to be affected.';
      break;
    case 4:
      healthImplications = 'Everyone may begin to experience health effects. Members of sensitive groups may experience more serious effects.';
      break;
    case 5:
      healthImplications = 'Health alert: Everyone may experience more serious health effects.';
      break;
  }
  
  return {
    significantPollutants,
    potentialSources: Array.from(potentialSources),
    healthImplications
  };
};

// Format date from unix timestamp
export const formatDate = (unixTime: number): string => {
  const date = new Date(unixTime * 1000);
  return date.toLocaleString();
};
