import { useState } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Coordinates } from "@/types/airQuality";

interface PlaceSearchProps {
  onLocationSelect: (coordinates: Coordinates) => void;
  isLoading?: boolean;
}

const PlaceSearch = ({ onLocationSelect, isLoading = false }: PlaceSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const handlePlaceSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      toast.error("Please enter a place name");
      return;
    }

    setSearching(true);
    try {
      // Using Nominatim API for geocoding (OpenStreetMap)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newCoords: Coordinates = { 
          lat: parseFloat(lat), 
          lon: parseFloat(lon) 
        };
        
        onLocationSelect(newCoords);
        toast.success(`Location found: ${data[0].display_name}`);
      } else {
        toast.error("Location not found. Please try a different search term.");
      }
    } catch (error) {
      console.error("Error searching for location:", error);
      toast.error("Error searching for location. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <form onSubmit={handlePlaceSearch} className="flex items-center gap-2">
      <Input 
        placeholder="Search for a place..." 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="flex-grow"
        disabled={isLoading || searching}
      />
      <Button type="submit" size="sm" disabled={isLoading || searching}>
        <Search className="h-4 w-4 mr-2" />
        {searching ? "Searching..." : "Search"}
      </Button>
    </form>
  );
};

export default PlaceSearch;