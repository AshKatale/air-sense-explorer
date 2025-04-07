import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl, CircleMarker } from 'react-leaflet';
import { toast } from "sonner";
import 'leaflet/dist/leaflet.css';
import { fetchAirQualityData, getAQICategory, getAQIColorClass, analyzePollutants } from '@/services/airQualityService';
import { Coordinates, AirQualityData } from '@/types/airQuality';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import L from 'leaflet';

// Fix for Leaflet marker icons
// This ensures Leaflet can find the marker images
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom marker for AQI using CircleMarker for better compatibility
const getAQIColor = (aqi) => {
  switch (aqi) {
    case 1: return '#009966'; // Good
    case 2: return '#FFDE33'; // Fair
    case 3: return '#FF9933'; // Moderate
    case 4: return '#CC0033'; // Poor
    case 5: return '#660099'; // Very Poor
    default: return '#AAAAAA'; // Unknown
  }
};

// Component to set map view when coordinates change
const SetViewOnCoordinatesChange = ({ coordinates }) => {
  const map = useMap();
  useEffect(() => {
    if (coordinates && coordinates.lat && coordinates.lon) {
      map.setView([coordinates.lat, coordinates.lon], map.getZoom());
    }
  }, [coordinates, map]);
  return null;
};

// Click handler component
const MapClickHandler = ({ onLocationSelect }) => {
  const map = useMap();
  
  useEffect(() => {
    const handleClick = (e) => {
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

const AirQualityMap = ({ onLocationSelect }) => {
  const [currentLocation, setCurrentLocation] = useState({ lat: 51.505, lon: -0.09 });
  const [currentData, setCurrentData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapInitialized, setMapInitialized] = useState(false);
  const mapRef = useRef(null);

  useEffect(() => {
    // Try to get the user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const newCoords = {
          lat: position.coords.latitude,
          lon: position.coords.longitude
        };
        setCurrentLocation(newCoords);
        if (onLocationSelect) onLocationSelect(newCoords);
        setMapInitialized(true);
      }, (error) => {
        console.log("Geolocation error:", error);
        // Default to London if geolocation fails
        if (onLocationSelect) onLocationSelect(currentLocation);
        setMapInitialized(true);
      });
    } else {
      setMapInitialized(true);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentLocation.lat || !currentLocation.lon) return;
      
      setIsLoading(true);
      try {
        // You can use OpenWeatherMap's free air quality API
        // Replace with your API key
        const apiKey = 'fbd40a016addc88a2fb8ad950326cee9'
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/air_pollution?lat=${currentLocation.lat}&lon=${currentLocation.lon}&appid=${apiKey}`
        );
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        if (data && data.list && data.list.length > 0) {
          setCurrentData(data.list[0]);
        }
      } catch (error) {
        console.error("Error fetching air quality data:", error);
        toast.error("Could not fetch air quality data");
      } finally {
        setIsLoading(false);
      }
    };

    if (mapInitialized) {
      fetchData();
    }
  }, [currentLocation, mapInitialized]);

  const handleMapClick = (lat, lng) => {
    const newCoords = { lat, lon: lng };
    setCurrentLocation(newCoords);
    if (onLocationSelect) onLocationSelect(newCoords);
    toast.info(`Selected location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
  };

  const handlePlaceSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error("Please enter a place name");
      return;
    }

    setIsLoading(true);
    try {
      // Using Nominatim API for geocoding (OpenStreetMap)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      
      if (!response.ok) {
        throw new Error(`Geocoding error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newCoords = { lat: parseFloat(lat), lon: parseFloat(lon) };
        setCurrentLocation(newCoords);
        if (onLocationSelect) onLocationSelect(newCoords);
        toast.success(`Location found: ${data[0].display_name}`);
      } else {
        toast.error("Location not found. Please try a different search term.");
      }
    } catch (error) {
      console.error("Error searching for location:", error);
      toast.error("Error searching for location. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
        <form onSubmit={handlePlaceSearch} className="flex items-center gap-2 mt-2">
          <Input 
            placeholder="Search for a place..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-grow"
          />
          <Button type="submit" size="sm" disabled={isLoading}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </form>
      </CardHeader>
      <CardContent className="p-0 relative h-[calc(100%-100px)]">
        {mapInitialized ? (
          <MapContainer
            center={[currentLocation.lat, currentLocation.lon]}
            zoom={10}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
            whenCreated={(map) => {
              mapRef.current = map;
            }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ZoomControl position="bottomright" />
            <SetViewOnCoordinatesChange coordinates={currentLocation} />
            <MapClickHandler onLocationSelect={handleMapClick} />
            
            {currentData && (
              <CircleMarker 
                center={[currentLocation.lat, currentLocation.lon]}
                pathOptions={{
                  fillColor: getAQIColor(currentData.main.aqi),
                  fillOpacity: 0.7,
                  color: 'white',
                  weight: 2
                }}
                radius={20}
              >
                <Popup>
                  <div className="p-2">
                    <div className="font-bold mb-1">
                      Air Quality: {getAQICategory(currentData.main.aqi)}
                    </div>
                    <div className="inline-block px-2 py-1 rounded-full text-xs font-bold" 
                         style={{ backgroundColor: getAQIColor(currentData.main.aqi), color: 'white' }}>
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
                        if (onLocationSelect) onLocationSelect(currentLocation);
                      }}
                    >
                      View Detailed Analysis
                    </Button>
                  </div>
                </Popup>
              </CircleMarker>
            )}
          </MapContainer>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/10">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading map...</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AirQualityMap;