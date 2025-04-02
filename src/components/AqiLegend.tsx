
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AqiLegend = () => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Air Quality Index (AQI) Legend</CardTitle>
      </CardHeader>
      <CardContent className="text-xs">
        <div className="grid grid-cols-5 gap-1">
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-aqi-good"></div>
            <span className="mt-1 text-center">1 - Good</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-aqi-fair"></div>
            <span className="mt-1 text-center">2 - Fair</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-aqi-moderate"></div>
            <span className="mt-1 text-center">3 - Moderate</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-aqi-poor"></div>
            <span className="mt-1 text-center">4 - Poor</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-aqi-verypoor"></div>
            <span className="mt-1 text-center">5 - Very Poor</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AqiLegend;
