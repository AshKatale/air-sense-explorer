
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ApiKeyInput from "@/components/ApiKeyInput";
import { CloudSun, Map, TrendingUp, Settings } from "lucide-react";

const Index = () => {
  const [hasValidKey, setHasValidKey] = useState(false);
  const navigate = useNavigate();

  const handleValidKey = () => {
    setHasValidKey(true);
    setTimeout(() => navigate('/dashboard'), 1000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        {!hasValidKey ? (
          <div className="container max-w-6xl mx-auto px-4 py-16">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Air<span className="text-primary">Sense</span> Explorer
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Monitor and analyze urban air pollution through advanced data visualization and remote sensing
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <Card className="p-6 flex flex-col items-center text-center">
                <CloudSun className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Real-Time Monitoring</h3>
                <p className="text-muted-foreground">
                  Access current air quality data with detailed pollutant information and AQI levels
                </p>
              </Card>
              
              <Card className="p-6 flex flex-col items-center text-center">
                <TrendingUp className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Historical Analysis</h3>
                <p className="text-muted-foreground">
                  View historical trends and forecast data to understand changing air quality patterns
                </p>
              </Card>
              
              <Card className="p-6 flex flex-col items-center text-center">
                <Map className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Interactive Mapping</h3>
                <p className="text-muted-foreground">
                  Explore air pollution through interactive maps with color-coded AQI indicators
                </p>
              </Card>
            </div>
            
            <div className="max-w-md mx-auto">
              <ApiKeyInput onValidKey={handleValidKey} />
            </div>
          </div>
        ) : (
          <div className="container max-w-md mx-auto h-screen flex flex-col items-center justify-center">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] mb-4" role="status">
              </div>
              <h2 className="text-2xl font-bold">Loading Dashboard</h2>
              <p className="text-muted-foreground mt-2">Preparing your air quality analysis tools...</p>
            </div>
          </div>
        )}
      </main>
      
      <footer className="container mx-auto p-4 text-center text-sm text-muted-foreground">
        <p>
          Data provided by OpenWeather Air Pollution API
        </p>
      </footer>
    </div>
  );
};

export default Index;
