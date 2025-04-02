
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AirQualityData } from "@/types/airQuality";
import { getAQICategory, getAQIColorClass, analyzePollutants } from "@/services/airQualityService";

interface AnalysisSummaryProps {
  data: AirQualityData;
}

const AnalysisSummary = ({ data }: AnalysisSummaryProps) => {
  const analysis = analyzePollutants(data.components);
  const aqiColorClass = getAQIColorClass(data.main.aqi);
  
  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>Air Quality Analysis</CardTitle>
          <Badge className={aqiColorClass}>
            AQI {data.main.aqi} - {getAQICategory(data.main.aqi)}
          </Badge>
        </div>
        <CardDescription>
          Analysis based on current pollutant levels
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {analysis.significantPollutants.length > 0 ? (
          <>
            <div>
              <h4 className="font-semibold mb-1">Significant Pollutants:</h4>
              <div className="flex flex-wrap gap-1">
                {analysis.significantPollutants.map((pollutant) => (
                  <Badge key={pollutant} variant="outline">
                    {pollutant}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-1">Potential Sources:</h4>
              <ul className="list-disc list-inside text-sm">
                {analysis.potentialSources.map((source, index) => (
                  <li key={index}>{source}</li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <div>
            <p className="text-green-600 font-medium">
              No significant pollutants detected at concerning levels.
            </p>
          </div>
        )}
        
        <div>
          <h4 className="font-semibold mb-1">Health Implications:</h4>
          <p className="text-sm">{analysis.healthImplications}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalysisSummary;
