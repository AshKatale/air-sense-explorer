
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AirQualityData } from "@/types/airQuality";
import { formatDate, getAQICategory, pollutantInfo } from "@/services/airQualityService";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface ForecastChartProps {
  data: AirQualityData[];
}

const ForecastChart = ({ data }: ForecastChartProps) => {
  const [selectedPollutant, setSelectedPollutant] = useState<string>("pm2_5");
  
  // Prepare data for the chart - group by day and hour for 24h intervals
  const prepareData = () => {
    return data.map((item) => {
      const date = new Date(item.dt * 1000);
      return {
        time: `${date.getHours()}:00`,
        day: date.toLocaleDateString(),
        fullDate: date,
        ...item.components,
        aqi: item.main.aqi,
        aqiCategory: getAQICategory(item.main.aqi),
        dt: item.dt
      };
    });
  };
  
  const chartData = prepareData();
  
  // Get days for tabs
  const days = Array.from(new Set(chartData.map(item => item.day)));
  
  // Format Y-axis ticks based on pollutant thresholds
  const getYAxisDomain = (pollutant: string) => {
    if (!pollutantInfo[pollutant]) return [0, 'auto'];
    
    // Get max value in data for this pollutant
    const maxValue = Math.max(...chartData.map(item => item[pollutant as keyof typeof item] as number));
    const thresholds = pollutantInfo[pollutant].thresholds;
    
    // Return a good max value that shows all thresholds
    if (maxValue < thresholds.good) return [0, thresholds.good];
    if (maxValue < thresholds.fair) return [0, thresholds.fair];
    if (maxValue < thresholds.moderate) return [0, thresholds.moderate];
    if (maxValue < thresholds.poor) return [0, thresholds.poor];
    
    // If it's above the "poor" threshold, add some padding
    return [0, maxValue * 1.1];
  };
  
  const getLineColor = () => {
    switch (selectedPollutant) {
      case "co": return "#9A6324"; // Brown
      case "no": return "#808000"; // Olive 
      case "no2": return "#e6194B"; // Red
      case "o3": return "#3cb44b"; // Green
      case "so2": return "#808080"; // Gray
      case "pm2_5": return "#9400D3"; // Purple
      case "pm10": return "#4363d8"; // Blue
      case "nh3": return "#ffe119"; // Yellow
      default: return "#000000"; // Black
    }
  };
  
  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <CardTitle>Air Quality Forecast</CardTitle>
        <CardDescription>
          Chart showing forecast for the next 4 days
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {Object.keys(pollutantInfo).map((key) => (
              <button
                key={key}
                onClick={() => setSelectedPollutant(key)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  selectedPollutant === key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 hover:bg-muted"
                }`}
              >
                {pollutantInfo[key].name}
              </button>
            ))}
          </div>
          
          <Tabs defaultValue={days[0]}>
            <TabsList className="w-full overflow-x-auto flex-nowrap">
              {days.map((day, index) => (
                <TabsTrigger key={index} value={day} className="text-xs">
                  {new Date(day).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {days.map((day, index) => {
              const dayData = chartData.filter(item => item.day === day);
              
              return (
                <TabsContent key={index} value={day} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={dayData}
                      margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis 
                        dataKey="time" 
                        tick={{ fontSize: 12 }} 
                      />
                      <YAxis 
                        domain={getYAxisDomain(selectedPollutant)}
                        tick={{ fontSize: 12 }}
                        width={50}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`${value} ${pollutantInfo[selectedPollutant]?.unit || ''}`, pollutantInfo[selectedPollutant]?.name || selectedPollutant]}
                        labelFormatter={(label) => `Time: ${label}`}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey={selectedPollutant}
                        name={pollutantInfo[selectedPollutant]?.name || selectedPollutant}
                        stroke={getLineColor()}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
};

export default ForecastChart;
