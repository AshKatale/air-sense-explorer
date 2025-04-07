import { Coordinates, AirPollutionResponse } from "@/types/airQuality";

const API_KEY_STORAGE_KEY = 'openweather-api-key';

// Pollutant information including human-readable names, units, and threshold values
export const pollutantInfo = {
  co: {
    name: "CO",
    fullName: "Carbon Monoxide",
    unit: "μg/m³",
    description: "A toxic gas formed by incomplete combustion of carbon-containing fuels.",
    sources: "Vehicle exhaust, industrial processes, and wood burning are major sources.",
    healthEffects: "Reduces oxygen delivery to organs and tissues, can cause headaches, dizziness, and at high concentrations, death.",
    thresholds: {
      good: 4400,
      fair: 9400,
      moderate: 12400,
      poor: 15400
    }
  },
  no2: {
    name: "NO₂",
    fullName: "Nitrogen Dioxide",
    unit: "μg/m³",
    description: "A reddish-brown gas with a sharp, harsh odor.",
    sources: "Vehicle emissions, power plants, and industrial processes.",
    healthEffects: "Can irritate airways, aggravate respiratory diseases, contribute to the development of asthma and potentially increase susceptibility to respiratory infections.",
    thresholds: {
      good: 40,
      fair: 70,
      moderate: 150,
      poor: 200
    }
  },
  o3: {
    name: "O₃",
    fullName: "Ozone",
    unit: "μg/m³",
    description: "A colorless gas formed through reactions between NOx and VOCs in the presence of sunlight.",
    sources: "Not directly emitted but formed from reactions involving nitrogen oxides and volatile organic compounds in sunlight.",
    healthEffects: "Can cause chest pain, coughing, throat irritation, and airway inflammation. It can worsen bronchitis, emphysema, and asthma.",
    thresholds: {
      good: 60,
      fair: 100,
      moderate: 140,
      poor: 180
    }
  },
  so2: {
    name: "SO₂",
    fullName: "Sulfur Dioxide",
    unit: "μg/m³",
    description: "A colorless gas with a strong odor.",
    sources: "Fossil fuel combustion at power plants, industrial processes, and burning high-sulfur containing fuels.",
    healthEffects: "Affects the respiratory system, causing irritation and inflammation. Can aggravate asthma and make breathing difficult.",
    thresholds: {
      good: 20,
      fair: 80,
      moderate: 250,
      poor: 350
    }
  },
  pm2_5: {
    name: "PM2.5",
    fullName: "Fine Particles",
    unit: "μg/m³",
    description: "Tiny particles with a diameter of 2.5 micrometers or less that can penetrate deep into the lungs.",
    sources: "Combustion sources, vehicle emissions, industrial processes, and natural sources like dust and wildfires.",
    healthEffects: "Can penetrate deep into the lungs and even enter the bloodstream, leading to respiratory and cardiovascular problems, and premature death in people with heart or lung disease.",
    thresholds: {
      good: 10,
      fair: 25,
      moderate: 50,
      poor: 75
    }
  },
  pm10: {
    name: "PM10",
    fullName: "Coarse Particles",
    unit: "μg/m³",
    description: "Inhalable particles with a diameter of 10 micrometers or less.",
    sources: "Dust, pollen, mold, and some combustion processes.",
    healthEffects: "Can cause respiratory issues, aggravate asthma, and contribute to heart and lung diseases.",
    thresholds: {
      good: 20,
      fair: 50,
      moderate: 100,
      poor: 200
    }
  },
  nh3: {
    name: "NH₃",
    fullName: "Ammonia",
    unit: "μg/m³",
    description: "A colorless gas with a pungent odor.",
    sources: "Agricultural activities, livestock waste, and fertilizer application.",
    healthEffects: "Can irritate the respiratory tract and eyes. Also contributes to the formation of secondary particulate matter.",
    thresholds: {
      good: 200,
      fair: 400,
      moderate: 800,
      poor: 1200
    }
  }
};

// Get API key from local storage
export const getApiKey = (): string | null => {
  return localStorage.getItem(API_KEY_STORAGE_KEY);
};

// Set and validate API key
export const setApiKey = async (key: string): Promise<boolean> => {
  try {
    // Try a simple API call to validate the key
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=51.51&lon=-0.13&appid=${key}`
    );
    
    if (response.ok) {
      localStorage.setItem(API_KEY_STORAGE_KEY, key);
      return true;
    } else {
      console.error("Invalid API key:", await response.json());
      return false;
    }
  } catch (error) {
    console.error("Error validating API key:", error);
    return false;
  }
};

// Check if the saved API key is valid
export const isValidApiKey = async (): Promise<boolean> => {
  const key = getApiKey();
  if (!key) return false;
  
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=51.51&lon=-0.13&appid=${key}`
    );
    return response.ok;
  } catch (error) {
    console.error("Error validating API key:", error);
    return false;
  }
};

// Fetch air quality data
export const fetchAirQualityData = async (
  lat: number, 
  lon: number, 
  type: 'current' | 'forecast' | 'historical' = 'current'
): Promise<AirPollutionResponse> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API key not found");
  }

  let endpoint = '';
  switch (type) {
    case 'current':
      endpoint = 'air_pollution';
      break;
    case 'forecast':
      endpoint = 'air_pollution/forecast';
      break;
    case 'historical':
      // For historical data, we would need start and end timestamps
      // This is simplified for the example
      const now = Math.floor(Date.now() / 1000);
      const weekAgo = now - 7 * 24 * 60 * 60;
      endpoint = `air_pollution/history?start=${weekAgo}&end=${now}`;
      break;
  }

  const url = `https://api.openweathermap.org/data/2.5/${endpoint}?lat=${lat}&lon=${lon}&appid=${apiKey}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch air quality data: ${response.statusText}`);
  }
  
  return await response.json();
};

// Get AQI category based on the AQI index (1-5)
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

// Get AQI color class for styling based on AQI index
export const getAQIColorClass = (aqi: number): string => {
  switch (aqi) {
    case 1:
      return "bg-green-500 text-white";
    case 2:
      return "bg-yellow-500 text-black";
    case 3:
      return "bg-orange-500 text-white";
    case 4:
      return "bg-red-500 text-white";
    case 5:
      return "bg-purple-500 text-white";
    default:
      return "bg-gray-500 text-white";
  }
};

// Analyze pollutants and provide recommendations
export const analyzePollutants = (components: Record<string, number>) => {
  const concerns = [];
  const recommendations = [];

  // Check PM2.5 levels
  if (components.pm2_5 > pollutantInfo.pm2_5.thresholds.moderate) {
    concerns.push("High levels of fine particulate matter (PM2.5)");
    recommendations.push("Consider using an air purifier indoors");
    recommendations.push("Limit outdoor activities, especially for sensitive groups");
  }

  // Check Ozone levels
  if (components.o3 > pollutantInfo.o3.thresholds.moderate) {
    concerns.push("Elevated ozone levels");
    recommendations.push("Avoid strenuous outdoor activities during peak sun hours");
  }

  // Check NO2 levels
  if (components.no2 > pollutantInfo.no2.thresholds.moderate) {
    concerns.push("High nitrogen dioxide levels");
    recommendations.push("Keep windows closed near high-traffic areas");
  }

  // If no specific concerns, provide general advice
  if (concerns.length === 0) {
    concerns.push("Air quality is generally acceptable");
    recommendations.push("Continue normal activities");
  }

  return { concerns, recommendations };
};