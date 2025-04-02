
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MapPin, Search } from "lucide-react";

interface CoordinateInputProps {
  onSubmit: (lat: number, lon: number) => void;
  initialCoordinates: { lat: number; lon: number };
}

const CoordinateInput = ({ onSubmit, initialCoordinates }: CoordinateInputProps) => {
  const [lat, setLat] = useState(initialCoordinates.lat.toString());
  const [lon, setLon] = useState(initialCoordinates.lon.toString());

  useEffect(() => {
    setLat(initialCoordinates.lat.toString());
    setLon(initialCoordinates.lon.toString());
  }, [initialCoordinates]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsedLat = parseFloat(lat);
    const parsedLon = parseFloat(lon);
    
    if (isNaN(parsedLat) || isNaN(parsedLon)) {
      toast.error("Please enter valid latitude and longitude values");
      return;
    }
    
    if (parsedLat < -90 || parsedLat > 90) {
      toast.error("Latitude must be between -90 and 90");
      return;
    }
    
    if (parsedLon < -180 || parsedLon > 180) {
      toast.error("Longitude must be between -180 and 180");
      return;
    }
    
    onSubmit(parsedLat, parsedLon);
  };
  
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      toast.info("Getting your current location...");
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLat(latitude.toString());
          setLon(longitude.toString());
          onSubmit(latitude, longitude);
          toast.success("Location updated to your current position");
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Could not get your location. Please check your browser permissions.");
        }
      );
    } else {
      toast.error("Geolocation is not supported by your browser");
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Location</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="latitude" className="text-sm font-medium">
                Latitude
              </label>
              <Input 
                id="latitude" 
                value={lat} 
                onChange={(e) => setLat(e.target.value)}
                placeholder="Enter latitude (-90 to 90)"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="longitude" className="text-sm font-medium">
                Longitude
              </label>
              <Input 
                id="longitude" 
                value={lon} 
                onChange={(e) => setLon(e.target.value)}
                placeholder="Enter longitude (-180 to 180)"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1" variant="default">
              <Search className="w-4 h-4 mr-2" />
              Analyze Location
            </Button>
            <Button type="button" variant="outline" onClick={getCurrentLocation}>
              <MapPin className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CoordinateInput;
