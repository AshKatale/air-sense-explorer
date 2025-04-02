
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Coordinates, AirQualityData, AirPollutionResponse } from "@/types/airQuality";
import { fetchAirQualityData, pollutantInfo } from "@/services/airQualityService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AirQualityMap from "@/components/AirQualityMap";
import CurrentDataCard from "@/components/CurrentDataCard";
import AnalysisSummary from "@/components/AnalysisSummary";
import ForecastChart from "@/components/ForecastChart";
import HistoricalDataChart from "@/components/HistoricalDataChart";
import CoordinateInput from "@/components/CoordinateInput";
import AqiLegend from "@/components/AqiLegend";
import PollutantDetailsDrawer from "@/components/PollutantDetailsDrawer";

const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [coordinates, setCoordinates] = useState<Coordinates>({
    lat: 51.505,
    lon: -0.09,
  });
  const [currentData, setCurrentData] = useState<AirQualityData | null>(null);
  const [forecastData, setForecastData] = useState<AirQualityData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedPollutant, setSelectedPollutant] = useState<string | null>(null);
  const [selectedPollutantValue, setSelectedPollutantValue] = useState<number | undefined>(undefined);

  // Update URL params when coordinates change
  useEffect(() => {
    setSearchParams({
      lat: coordinates.lat.toString(),
      lon: coordinates.lon.toString(),
    });
  }, [coordinates, setSearchParams]);

  // Try to get coordinates from URL params on initial load
  useEffect(() => {
    const latParam = searchParams.get('lat');
    const lonParam = searchParams.get('lon');
    
    if (latParam && lonParam) {
      const lat = parseFloat(latParam);
      const lon = parseFloat(lonParam);
      
      if (!isNaN(lat) && !isNaN(lon)) {
        setCoordinates({ lat, lon });
      }
    }
  }, []);

  // Fetch current and forecast data when coordinates change
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        // Fetch current data
        const current = await fetchAirQualityData(coordinates.lat, coordinates.lon, 'current');
        if (current && current.list && current.list.length > 0) {
          setCurrentData(current.list[0]);
        } else {
          setCurrentData(null);
        }
        
        // Fetch forecast data
        const forecast = await fetchAirQualityData(coordinates.lat, coordinates.lon, 'forecast');
        if (forecast && forecast.list && forecast.list.length > 0) {
          setForecastData(forecast.list);
        } else {
          setForecastData([]);
        }
        
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to fetch air quality data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [coordinates]);

  const handleLocationSelect = (newCoords: Coordinates) => {
    setCoordinates(newCoords);
  };
  
  const handlePollutantClick = (pollutant: string, value?: number) => {
    setSelectedPollutant(pollutant);
    setSelectedPollutantValue(value);
  };
  
  const closePollutantDetails = () => {
    setSelectedPollutant(null);
  };

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Urban Air Pollution Explorer</h1>
        <p className="text-muted-foreground mb-6">
          Monitor and analyze air quality data using OpenWeather's Air Pollution API
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="md:col-span-2">
            <CoordinateInput 
              onSubmit={(lat, lon) => setCoordinates({ lat, lon })}
              initialCoordinates={coordinates}
            />
          </div>
          <AqiLegend />
        </div>

        <AirQualityMap onLocationSelect={handleLocationSelect} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Loading air quality data...</p>
          </div>
        </div>
      ) : (
        <>
          {currentData ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CurrentDataCard data={currentData} />
                <AnalysisSummary data={currentData} />
              </div>
              
              <Tabs defaultValue="forecast">
                <TabsList>
                  <TabsTrigger value="forecast">Forecast</TabsTrigger>
                  <TabsTrigger value="historical">Historical</TabsTrigger>
                  <TabsTrigger value="pollutants">Pollutant Details</TabsTrigger>
                </TabsList>
                
                <TabsContent value="forecast" className="mt-4">
                  {forecastData.length > 0 ? (
                    <ForecastChart data={forecastData} />
                  ) : (
                    <div className="bg-muted/30 p-6 rounded-lg text-center">
                      <p>No forecast data available for this location.</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="historical" className="mt-4">
                  <HistoricalDataChart coordinates={coordinates} />
                </TabsContent>
                
                <TabsContent value="pollutants" className="mt-4">
                  <div className="bg-muted/30 p-6 rounded-lg">
                    <h3 className="font-medium mb-4">Pollutant Information</h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(pollutantInfo).map(([key, info]) => {
                        const value = currentData.components[key as keyof typeof currentData.components];
                        
                        // Determine severity based on thresholds
                        let severity = "border-green-500";
                        if (value > info.thresholds.poor) {
                          severity = "border-purple-500";
                        } else if (value > info.thresholds.moderate) {
                          severity = "border-red-500";
                        } else if (value > info.thresholds.fair) {
                          severity = "border-orange-500";
                        } else if (value > info.thresholds.good) {
                          severity = "border-yellow-500";
                        }
                        
                        return (
                          <button
                            key={key}
                            className={`p-4 border-l-4 ${severity} bg-card hover:bg-muted/50 rounded-md transition-colors`}
                            onClick={() => handlePollutantClick(key, value)}
                          >
                            <div className="text-left">
                              <div className="font-medium">{info.name}</div>
                              <div className="text-xs text-muted-foreground">{info.fullName}</div>
                              <div className="mt-2 font-bold">
                                {value} <span className="text-xs font-normal">{info.unit}</span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    
                    <div className="mt-6 text-sm text-muted-foreground">
                      <p>Click on any pollutant to see detailed information about sources, health effects, and thresholds.</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="bg-muted/30 p-6 rounded-lg text-center">
              <p>No air quality data available for this location. Please try a different location.</p>
            </div>
          )}
        </>
      )}
      
      <PollutantDetailsDrawer 
        isOpen={!!selectedPollutant}
        onClose={closePollutantDetails}
        pollutant={selectedPollutant || undefined}
        value={selectedPollutantValue}
      />
    </div>
  );
};

export default Dashboard;
