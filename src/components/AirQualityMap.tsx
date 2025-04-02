
import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import { toast } from "sonner";
import 'leaflet/dist/leaflet.css';
import { fetchAirQualityData, getAQICategory, getAQIColorClass, analyzePollutants } from '@/services/airQualityService';
import { Coordinates, AirQualityData } from '@/types/airQuality';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import L from 'leaflet';

// Fix for Leaflet marker icons
// This redefines the icon paths for Leaflet markers
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom marker for AQI
const createAQIMarkerIcon = (aqi: number) => {
  return L.divIcon({
    className: `aqi-marker aqi-marker-${aqi}`,
    html: `<div>${aqi}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });
};

// Component to set map view when coordinates change
const SetViewOnCoordinatesChange = ({ coordinates }: { coordinates: Coordinates }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([coordinates.lat, coordinates.lon], map.getZoom());
  }, [coordinates, map]);
  return null;
};

// Click handler component
const MapClickHandler = ({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) => {
  const map = useMap();
  
  useEffect(() => {
    const handleClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
    };
    
    map.on('click', handleClick);
    
    return () => {
      map.off('click', handleClick);
    };
  }, [map, onLocationSelect]);
  
  return null;
};

interface AirQualityMapProps {
  onLocationSelect: (coordinates: Coordinates) => void;
}

const AirQualityMap = ({ onLocationSelect }: AirQualityMapProps) => {
  const [currentLocation, setCurrentLocation] = useState<Coordinates>({ lat: 51.505, lon: -0.09 });
  const [currentData, setCurrentData] = useState<AirQualityData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Try to get the user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const newCoords = {
          lat: position.coords.latitude,
          lon: position.coords.longitude
        };
        setCurrentLocation(newCoords);
        onLocationSelect(newCoords);
      }, (error) => {
        console.log("Geolocation error:", error);
        // Default to London if geolocation fails
        onLocationSelect(currentLocation);
      });
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchAirQualityData(currentLocation.lat, currentLocation.lon);
        if (data && data.list && data.list.length > 0) {
          setCurrentData(data.list[0]);
        }
      } catch (error) {
        console.error("Error fetching air quality data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentLocation]);

  const handleMapClick = (lat: number, lng: number) => {
    const newCoords = { lat, lon: lng };
    setCurrentLocation(newCoords);
    onLocationSelect(newCoords);
    toast.info(`Selected location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
  };

  return (
    <Card className="w-full h-[500px] md:h-[600px] shadow-md">
      <CardHeader className="p-4">
        <CardTitle className="text-lg flex justify-between items-center">
          <span>Air Quality Map</span>
          {isLoading && (
            <Badge variant="outline" className="animate-pulse">Loading data...</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <MapContainer
          center={[currentLocation.lat, currentLocation.lon]}
          zoom={10}
          style={{ height: "calc(100% - 60px)", width: "100%" }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ZoomControl position="bottomright" />
          <SetViewOnCoordinatesChange coordinates={currentLocation} />
          <MapClickHandler onLocationSelect={handleMapClick} />
          
          {currentData && (
            <Marker 
              position={[currentLocation.lat, currentLocation.lon]} 
              icon={createAQIMarkerIcon(currentData.main.aqi)}
            >
              <Popup>
                <div className="p-2">
                  <div className="font-bold mb-1">
                    Air Quality: {getAQICategory(currentData.main.aqi)}
                  </div>
                  <div className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${getAQIColorClass(currentData.main.aqi)}`}>
                    AQI Level: {currentData.main.aqi}
                  </div>
                  <div className="mt-2 text-xs">
                    <p className="mb-1">
                      <span className="font-semibold">CO:</span> {currentData.components.co} μg/m³
                    </p>
                    <p className="mb-1">
                      <span className="font-semibold">NO₂:</span> {currentData.components.no2} μg/m³
                    </p>
                    <p className="mb-1">
                      <span className="font-semibold">O₃:</span> {currentData.components.o3} μg/m³
                    </p>
                    <p className="mb-1">
                      <span className="font-semibold">PM2.5:</span> {currentData.components.pm2_5} μg/m³
                    </p>
                    <p className="mb-1">
                      <span className="font-semibold">PM10:</span> {currentData.components.pm10} μg/m³
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full mt-2 text-xs" 
                    onClick={() => {
                      onLocationSelect(currentLocation);
                    }}
                  >
                    View Detailed Analysis
                  </Button>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </CardContent>
    </Card>
  );
};

export default AirQualityMap;
