
import { Coordinates, AirQualityData, AirPollutionResponse, AirPollutionComponents } from "@/types/airQuality";

const API_KEY_STORAGE_KEY = "openweather_api_key";
const DEFAULT_API_KEY = "11ea526c4df54f749a4175954232011"; // Fallback API key

// Function to get the API key from localStorage or use default
export const getApiKey = (): string => {
  return localStorage.getItem(API_KEY_STORAGE_KEY) || DEFAULT_API_KEY;
};

// Function to save API key to localStorage and validate it
export const setApiKey = async (key: string): Promise<boolean> => {
  try {
    // Test the API key with a simple request
    const testResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=51.505&lon=-0.09&appid=${key}`
    );
    
    if (testResponse.ok) {
      localStorage.setItem(API_KEY_STORAGE_KEY, key);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error validating API key:", error);
    return false;
  }
};

// Function to validate the existing API key
export const isValidApiKey = async (): Promise<boolean> => {
  const key = getApiKey();
  if (!key) return false;
  
  try {
    const testResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=51.505&lon=-0.09&appid=${key}`
    );
    return testResponse.ok;
  } catch (error) {
    console.error("Error validating API key:", error);
    return false;
  }
};

// Format date for charts and display
export const formatDate = (dt: number): string => {
  const date = new Date(dt * 1000);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(date);
};

// AQI Categories based on the Air Quality Index
export const getAQICategory = (aqi: number): string => {
  switch (aqi) {
    case 1:
      return "Good";
    case 2:
      return "Fair";
    case 3:
      return "Moderate";
    case 4:
      return "Poor";
    case 5:
      return "Very Poor";
    default:
      return "Unknown";
  }
};

// Color classes for AQI based on Tailwind CSS
export const getAQIColorClass = (aqi: number): string => {
  switch (aqi) {
    case 1:
      return "bg-aqi-good text-green-900";
    case 2:
      return "bg-aqi-fair text-yellow-900";
    case 3:
      return "bg-aqi-moderate text-orange-900";
    case 4:
      return "bg-aqi-poor text-red-900";
    case 5:
      return "bg-aqi-verypoor text-purple-900";
    default:
      return "bg-gray-300 text-gray-800";
  }
};

// Information about pollutants
export const pollutantInfo: Record<string, {
  name: string;
  fullName: string;
  description: string;
  unit: string;
  thresholds: {
    good: number;
    fair: number;
    moderate: number;
    poor: number;
  };
  healthEffects: string;
  sources: string[];
}> = {
  co: {
    name: "CO",
    fullName: "Carbon Monoxide",
    description: "Carbon monoxide is a colorless, odorless gas produced by incomplete combustion of carbon-containing fuels.",
    unit: "μg/m³",
    thresholds: {
      good: 4400,
      fair: 9400,
      moderate: 12400,
      poor: 15400
    },
    healthEffects: "Carbon monoxide reduces the blood's ability to carry oxygen. Low levels can cause dizziness, headaches, and fatigue. High levels can be fatal.",
    sources: [
      "Vehicle exhaust",
      "Coal and wood burning",
      "Gas furnaces and stoves",
      "Industrial processes"
    ]
  },
  no2: {
    name: "NO₂",
    fullName: "Nitrogen Dioxide",
    description: "Nitrogen dioxide is a reddish-brown gas with a sharp odor. It's part of a group of pollutants called nitrogen oxides (NOx).",
    unit: "μg/m³",
    thresholds: {
      good: 40,
      fair: 70,
      moderate: 150,
      poor: 200
    },
    healthEffects: "NO₂ can irritate the respiratory system, worsen asthma, and contribute to the development of respiratory infections. Long-term exposure may lead to respiratory diseases.",
    sources: [
      "Vehicle emissions",
      "Power plants",
      "Industrial processes",
      "Gas stoves and heaters"
    ]
  },
  o3: {
    name: "O₃",
    fullName: "Ozone",
    description: "Ozone at ground level is a harmful air pollutant formed when nitrogen oxides and volatile organic compounds react in sunlight.",
    unit: "μg/m³",
    thresholds: {
      good: 60,
      fair: 100,
      moderate: 140,
      poor: 180
    },
    healthEffects: "Ozone can cause coughing, throat irritation, chest pain, and reduced lung function. It can worsen asthma, bronchitis, and emphysema.",
    sources: [
      "Vehicle exhaust",
      "Industrial emissions",
      "Chemical solvents",
      "Created by sunlight reacting with other pollutants"
    ]
  },
  so2: {
    name: "SO₂",
    fullName: "Sulfur Dioxide",
    description: "Sulfur dioxide is a colorless gas with a sharp odor. It's produced by burning fossil fuels containing sulfur.",
    unit: "μg/m³",
    thresholds: {
      good: 20,
      fair: 80,
      moderate: 250,
      poor: 350
    },
    healthEffects: "SO₂ irritates the respiratory system, causing coughing, mucus secretion, and aggravation of asthma. Long-term exposure may contribute to respiratory illnesses.",
    sources: [
      "Coal and oil burning power plants",
      "Industrial processes",
      "Smelters",
      "Diesel vehicles"
    ]
  },
  pm2_5: {
    name: "PM2.5",
    fullName: "Fine Particulate Matter",
    description: "PM2.5 refers to tiny particles or droplets in the air that are 2.5 micrometers or less in width.",
    unit: "μg/m³",
    thresholds: {
      good: 10,
      fair: 25,
      moderate: 50,
      poor: 75
    },
    healthEffects: "PM2.5 can penetrate deep into the lungs and even enter the bloodstream, causing respiratory and cardiovascular problems, including irregular heartbeat and premature death in people with heart or lung disease.",
    sources: [
      "Vehicle exhaust",
      "Power plants",
      "Wood burning",
      "Industrial processes",
      "Wildfires"
    ]
  },
  pm10: {
    name: "PM10",
    fullName: "Coarse Particulate Matter",
    description: "PM10 refers to inhalable particles with diameters generally 10 micrometers and smaller.",
    unit: "μg/m³",
    thresholds: {
      good: 20,
      fair: 50,
      moderate: 100,
      poor: 200
    },
    healthEffects: "PM10 can irritate the eyes, nose, and throat, and can cause respiratory issues, especially for people with existing conditions like asthma.",
    sources: [
      "Dust from roads and construction",
      "Agricultural operations",
      "Industrial processes",
      "Pollen and mold spores"
    ]
  },
  nh3: {
    name: "NH₃",
    fullName: "Ammonia",
    description: "Ammonia is a colorless gas with a pungent odor. It's an important source of nitrogen for plants and agriculture.",
    unit: "μg/m³",
    thresholds: {
      good: 100,
      fair: 200,
      moderate: 400,
      poor: 800
    },
    healthEffects: "Ammonia can irritate the respiratory tract, eyes, and skin. High concentrations can cause coughing and breathing difficulty.",
    sources: [
      "Agricultural activities",
      "Livestock waste",
      "Fertilizer application",
      "Industrial processes"
    ]
  }
};

// Helper to analyze pollutant levels based on thresholds
export const analyzePollutants = (components: AirPollutionComponents) => {
  const results = Object.entries(components).map(([key, value]) => {
    const info = pollutantInfo[key as keyof typeof pollutantInfo];
    if (!info) return null;
    
    let status: string;
    if (value >= info.thresholds.poor) {
      status = "Very High";
    } else if (value >= info.thresholds.moderate) {
      status = "High";
    } else if (value >= info.thresholds.fair) {
      status = "Moderate";
    } else if (value >= info.thresholds.good) {
      status = "Elevated";
    } else {
      status = "Low";
    }
    
    return {
      key,
      name: info.name,
      fullName: info.fullName,
      value,
      unit: info.unit,
      status
    };
  }).filter(Boolean);

  // Add derived analysis properties
  const analysisResults = results as any[];
  
  // Identify significant pollutants (those with High or Very High levels)
  analysisResults.significantPollutants = analysisResults
    .filter(p => p.status === "High" || p.status === "Very High")
    .map(p => p.name);

  // Add potential sources based on significant pollutants
  const allSources = new Set<string>();
  analysisResults
    .filter(p => p.status === "High" || p.status === "Very High")
    .forEach(p => {
      const info = pollutantInfo[p.key];
      if (info && info.sources) {
        info.sources.forEach(source => allSources.add(source));
      }
    });
  analysisResults.potentialSources = Array.from(allSources);

  // Add health implications
  const healthEffects = new Set<string>();
  analysisResults
    .filter(p => p.status !== "Low")
    .forEach(p => {
      const info = pollutantInfo[p.key];
      if (info && info.healthEffects) {
        healthEffects.add(info.healthEffects);
      }
    });
  analysisResults.healthImplications = Array.from(healthEffects);

  return analysisResults;
};

// Function to fetch air quality data
export const fetchAirQualityData = async (
  lat: number,
  lon: number,
  type: "current" | "forecast" | "historical" = "current",
  historyStart?: number,
  historyEnd?: number
): Promise<AirPollutionResponse> => {
  const baseUrl = "https://api.openweathermap.org/data/2.5/air_pollution";
  
  // Get API key from localStorage or use default
  const apiKey = getApiKey();
  
  let url: string;
  
  switch (type) {
    case "forecast":
      url = `${baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}`;
      break;
    case "historical":
      if (!historyStart || !historyEnd) {
        throw new Error("Historical data requires start and end timestamps");
      }
      url = `${baseUrl}/history?lat=${lat}&lon=${lon}&start=${historyStart}&end=${historyEnd}&appid=${apiKey}`;
      break;
    case "current":
    default:
      url = `${baseUrl}?lat=${lat}&lon=${lon}&appid=${apiKey}`;
      break;
  }
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch air quality data: ${response.statusText}`);
  }
  
  return await response.json();
};

export default {
  fetchAirQualityData,
  getAQICategory,
  getAQIColorClass,
  analyzePollutants,
  pollutantInfo,
  getApiKey,
  setApiKey,
  isValidApiKey,
  formatDate
};
