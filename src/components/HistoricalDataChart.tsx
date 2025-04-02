
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AirQualityData } from "@/types/airQuality";
import { formatDate, pollutantInfo } from "@/services/airQualityService";
import { fetchAirQualityData } from "@/services/airQualityService";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface HistoricalDataChartProps {
  coordinates: { lat: number; lon: number };
}

const HistoricalDataChart = ({ coordinates }: HistoricalDataChartProps) => {
  const [selectedPollutant, setSelectedPollutant] = useState<string>("pm2_5");
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [historicalData, setHistoricalData] = useState<AirQualityData[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Fetch historical data
  const fetchHistorical = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select start and end dates");
      return;
    }
    
    if (startDate > endDate) {
      toast.error("Start date must be before end date");
      return;
    }
    
    const timeDiff = endDate.getTime() - startDate.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);
    
    if (daysDiff > 30) {
      toast.error("Historical data retrieval is limited to 30 days");
      return;
    }
    
    setLoading(true);
    
    try {
      const startUnix = Math.floor(startDate.getTime() / 1000);
      const endUnix = Math.floor(endDate.getTime() / 1000);
      
      const data = await fetchAirQualityData(
        coordinates.lat,
        coordinates.lon,
        'historical',
        startUnix,
        endUnix
      );
      
      if (data && data.list && data.list.length > 0) {
        setHistoricalData(data.list);
        toast.success(`Retrieved ${data.list.length} historical data points`);
      } else {
        toast.warning("No historical data available for the selected period");
      }
    } catch (error) {
      console.error("Error fetching historical data:", error);
      toast.error("Failed to fetch historical data");
    } finally {
      setLoading(false);
    }
  };
  
  // Prepare data for the chart - group by day
  const prepareData = () => {
    const result = historicalData.map((item) => {
      const date = new Date(item.dt * 1000);
      return {
        time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        day: date.toLocaleDateString(),
        fullDate: date,
        ...item.components,
        aqi: item.main.aqi,
        dt: item.dt
      };
    });
    
    return result;
  };
  
  const chartData = prepareData();
  
  // Get days for tabs
  const days = Array.from(new Set(chartData.map(item => item.day)));
  
  // Format Y-axis ticks based on pollutant thresholds
  const getYAxisDomain = (pollutant: string) => {
    if (!pollutantInfo[pollutant]) return [0, 'auto'];
    
    // Get max value in data for this pollutant
    const maxValue = Math.max(...chartData.map(item => item[pollutant as keyof typeof item] as number || 0));
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
        <CardTitle>Historical Data Analysis</CardTitle>
        <CardDescription>
          Analyze air quality trends over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="grid gap-2">
              <div className="text-sm font-medium">Start Date</div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    {startDate ? (
                      format(startDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) => 
                      date > new Date() || 
                      date < new Date('2020-11-27')
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <div className="text-sm font-medium">End Date</div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    {endDate ? (
                      format(endDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => 
                      date > new Date() || 
                      date < new Date('2020-11-27') ||
                      (startDate ? date < startDate : false)
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Button 
              className="self-end" 
              onClick={fetchHistorical}
              disabled={loading || !startDate || !endDate}
            >
              {loading ? "Loading..." : "Fetch Data"}
            </Button>
          </div>
          
          {historicalData.length > 0 && (
            <>
              <div className="flex flex-wrap gap-2 mt-4">
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
              
              {days.length > 1 ? (
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
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
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
                </div>
              )}
            </>
          )}
          
          {historicalData.length === 0 && !loading && (
            <div className="h-[200px] flex items-center justify-center">
              <p className="text-muted-foreground text-center">
                Select a date range and click "Fetch Data" to view historical air quality trends<br />
                <span className="text-sm">Historical data is available from November 27, 2020</span>
              </p>
            </div>
          )}
          
          {loading && (
            <div className="h-[200px] flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Loading historical data...</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default HistoricalDataChart;
