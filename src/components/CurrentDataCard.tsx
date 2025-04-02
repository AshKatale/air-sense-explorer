
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AirQualityData } from "@/types/airQuality";
import { getAQICategory, getAQIColorClass, formatDate, pollutantInfo } from "@/services/airQualityService";

interface CurrentDataCardProps {
  data: AirQualityData;
}

const CurrentDataCard = ({ data }: CurrentDataCardProps) => {
  const aqiCategory = getAQICategory(data.main.aqi);
  const aqiColorClass = getAQIColorClass(data.main.aqi);
  
  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>Current Air Quality</CardTitle>
          <Badge className={aqiColorClass}>
            {aqiCategory}
          </Badge>
        </div>
        <CardDescription>
          As of {formatDate(data.dt)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.entries(data.components).map(([key, value]) => {
            if (!pollutantInfo[key]) return null;
            const info = pollutantInfo[key];
            
            // Determine severity based on thresholds
            let severity = "text-green-600";
            if (value > info.thresholds.poor) {
              severity = "text-purple-600 font-bold";
            } else if (value > info.thresholds.moderate) {
              severity = "text-red-600 font-bold";
            } else if (value > info.thresholds.fair) {
              severity = "text-orange-600";
            } else if (value > info.thresholds.good) {
              severity = "text-yellow-600";
            }
            
            return (
              <div key={key} className="p-2 bg-muted/50 rounded-lg">
                <div className="text-sm font-medium">{info.name}</div>
                <div className={`text-lg font-semibold ${severity}`}>
                  {value} <span className="text-xs text-muted-foreground">{info.unit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrentDataCard;
