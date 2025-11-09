// Home page - this is where everything starts
// basically just a search bar and some trip history
// also has the transport mode picker which was kinda fun to build

"use client";

import { Menu, Search, Navigation, Car, User, AlertTriangle, Bus, MapPin, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import NavigationMenu from "./components/Navigation";

interface Location {
  name: string;
  address: string;
  lat?: number;
  lon?: number;
  distance?: number | null;
}

export default function Home() {
  const router = useRouter();
  const [userName] = useState("Sophia");
  const [userId] = useState("user-" + Math.random().toString(36).substr(2, 9)); // Generate unique user ID
  const [selectedTransport, setSelectedTransport] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // grab user's location when page loads
  // needed this for calculating distances to search results
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          setCurrentLocation(location);
          
          // save it to backend too
          try {
            await fetch('/api/location', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId,
                lat: location.lat,
                lon: location.lon,
                preferredTransport: selectedTransport,
              }),
            });
          } catch (error) {
            console.error('Error storing location:', error);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Please enable location services to use this app');
        }
      );
    }
  }, [userId, selectedTransport]);

  const tripHistory = [
    {
      location: "Zachary Engineering Complex",
      address: "12345 Sigma Street",
      date: "November 7, 2025",
    },
    {
      location: "Rise College Station",
      address: "67 Sigma Street",
      date: "November 7, 2025",
    },
    {
      location: "Zachary Engineering Complex",
      address: "12345 Sigma Street",
      date: "November 6, 2025",
    },
  ];

  // this searches OpenStreetMap for locations as you type
  // had to use Nominatim API cuz Google Maps costs money lol
  useEffect(() => {
    const fetchLocations = async () => {
      if (searchQuery.length < 3) {
        setLocations([]);
        return;
      }

      setIsLoading(true);
      try {
        // build the search URL
        let searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=50&addressdetails=1&dedupe=0`;
        
        // if we have user's location, prioritize nearby results
        if (currentLocation) {
          // make a box around user (about 50 miles)
          const latRange = 0.7;
          const lonRange = 0.7;
          const viewbox = [
            currentLocation.lon - lonRange,
            currentLocation.lat + latRange,
            currentLocation.lon + lonRange,
            currentLocation.lat - latRange,
          ].join(',');
          
          searchUrl += `&viewbox=${viewbox}&bounded=0`;
        }

        const response = await fetch(searchUrl, {
          headers: {
            'User-Agent': 'GirlBoss App'
          }
        });
        const data = await response.json();
        
        const formattedLocations: Location[] = data.map((item: any) => {
          // Build a better formatted address
          const addressParts = [];
          if (item.address) {
            if (item.address.house_number) addressParts.push(item.address.house_number);
            if (item.address.road) addressParts.push(item.address.road);
            if (item.address.suburb) addressParts.push(item.address.suburb);
            if (item.address.city) addressParts.push(item.address.city);
            if (item.address.state) addressParts.push(item.address.state);
            if (item.address.postcode) addressParts.push(item.address.postcode);
            if (item.address.country) addressParts.push(item.address.country);
          }
          
          const lat = parseFloat(item.lat);
          const lon = parseFloat(item.lon);
          
          // Calculate distance from current location if available
          let distance = null;
          if (currentLocation) {
            distance = calculateDistance(
              currentLocation.lat,
              currentLocation.lon,
              lat,
              lon
            );
          }
          
          return {
            name: item.name || addressParts.slice(0, 2).join(' ') || item.display_name.split(',')[0],
            address: addressParts.length > 0 ? addressParts.join(', ') : item.display_name,
            lat,
            lon,
            distance,
          };
        });
        
        // Sort by distance - locations within 50 miles first
        const sortedLocations = formattedLocations.sort((a, b) => {
          if (a.distance !== null && a.distance !== undefined && b.distance !== null && b.distance !== undefined) {
            // Both have distances - sort by distance
            return a.distance - b.distance;
          } else if (a.distance !== null && a.distance !== undefined) {
            // a has distance, b doesn't - a comes first
            return -1;
          } else if (b.distance !== null && b.distance !== undefined) {
            // b has distance, a doesn't - b comes first
            return 1;
          }
          // Neither has distance - maintain original order
          return 0;
        });
        
        // Limit to 10 results for display
        setLocations(sortedLocations.slice(0, 10));
      } catch (error) {
        console.error("Error fetching locations:", error);
        setLocations([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchLocations();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, currentLocation]);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  };

  const toRad = (value: number): number => {
    return (value * Math.PI) / 180;
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
    setSearchQuery(location.name);
    setShowDropdown(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowDropdown(e.target.value.length > 0);
  };

  // Calculate route when destination is selected
  const calculateRoute = () => {
    if (!currentLocation || !selectedLocation || !selectedLocation.lat || !selectedLocation.lon) {
      alert('Please select a destination and ensure location is enabled');
      return;
    }

    if (!selectedTransport) {
      alert('Please select a preferred transport mode');
      return;
    }

    setIsCalculatingRoute(true);

    try {
      // Store the trip in backend before navigating
      fetch('/api/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          lat: currentLocation.lat,
          lon: currentLocation.lon,
          preferredTransport: selectedTransport,
          destination: selectedLocation.name,
        }),
      }).catch(err => console.error('Error storing trip:', err));

      // Navigate to trip page with route parameters
      const params = new URLSearchParams({
        destination: selectedLocation.name,
        transport: selectedTransport,
        startLat: currentLocation.lat.toString(),
        startLon: currentLocation.lon.toString(),
        endLat: selectedLocation.lat.toString(),
        endLon: selectedLocation.lon.toString(),
      });

      router.push(`/trip-options?${params.toString()}`);
    } catch (error) {
      console.error('Navigation error:', error);
      alert('Error starting trip. Please try again.');
      setIsCalculatingRoute(false);
    }
  };

  // Update transport preference in backend
  const handleTransportChange = async (transport: string) => {
    setSelectedTransport(transport);
    
    if (currentLocation) {
      try {
        await fetch('/api/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            lat: currentLocation.lat,
            lon: currentLocation.lon,
            preferredTransport: transport,
          }),
        });
      } catch (error) {
        console.error('Error updating transport preference:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <NavigationMenu isOpen={isNavOpen} onClose={() => setIsNavOpen(false)} />
      
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/')} className="cursor-pointer hover:opacity-80 transition-opacity">
            <Image
              src="/girlboss.png"
              alt="GirlBoss Logo"
              width={150}
              height={150}
              className="rounded-lg"
            />
          </button>
        </div>
        <button 
          onClick={() => setIsNavOpen(true)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6 text-gray-700" />
        </button>
      </header>

      {/* Main Content */}
      <main className="px-6 pt-8 pb-6 max-w-2xl mx-auto">
        {/* Greeting */}
        <h1 className="text-4xl font-bold mb-8 text-center">
          Hello, <span className="text-pink-500">{userName}</span>
        </h1>

        {/* Search Bar */}
        <div className="relative mb-10" ref={dropdownRef}>
          <input
            type="text"
            placeholder="Where do you want to go?"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => searchQuery.length > 0 && setShowDropdown(true)}
            className="w-full px-6 py-4 pr-12 rounded-full border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-700 placeholder-gray-400"
          />
          <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          
          {/* Dropdown */}
          {showDropdown && isLoading && (
            <div className="absolute z-10 w-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 text-center text-gray-500">
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                Searching worldwide...
              </div>
            </div>
          )}
          
          {showDropdown && !isLoading && locations.length > 0 && (
            <div className="absolute z-10 w-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 max-h-80 overflow-y-auto">
              {locations.map((location, index) => (
                <button
                  key={index}
                  onClick={() => handleLocationSelect(location)}
                  className="w-full flex items-start gap-3 p-4 hover:bg-pink-50 transition-colors text-left border-b border-gray-100 last:border-b-0 first:rounded-t-2xl last:rounded-b-2xl"
                >
                  <MapPin className="w-5 h-5 text-pink-500 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-gray-900">{location.name}</div>
                      {location.distance !== null && location.distance !== undefined && (
                        <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                          location.distance <= 50 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {location.distance.toFixed(1)} mi
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 line-clamp-2">{location.address}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {showDropdown && !isLoading && searchQuery.length >= 3 && locations.length === 0 && (
            <div className="absolute z-10 w-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 text-center text-gray-500">
              No locations found. Try typing more of the address.
            </div>
          )}
          
          {showDropdown && searchQuery.length > 0 && searchQuery.length < 3 && !isLoading && (
            <div className="absolute z-10 w-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 text-center text-gray-500">
              Type at least 3 characters to search...
            </div>
          )}
        </div>

        {/* Trip History */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-6">Trip History</h2>
          <div className="space-y-4">
            {tripHistory.map((trip, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors"
              >
                <div className="w-12 h-12 bg-pink-200 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Navigation className="w-6 h-6 text-pink-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {trip.location}
                  </h3>
                  <p className="text-gray-500 text-sm">{trip.address}</p>
                </div>
                <div className="text-sm text-gray-400 flex-shrink-0">
                  {trip.date}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preferred Transport */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-6">Preferred Transport</h2>
          <div className="space-y-3">
            <button
              onClick={() => handleTransportChange("driving")}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl border-2 transition-all ${
                selectedTransport === "driving"
                  ? "border-pink-500 bg-pink-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="w-12 h-12 bg-pink-200 rounded-full flex items-center justify-center">
                <Car className="w-6 h-6 text-pink-600" />
              </div>
              <span className="text-lg font-semibold text-gray-900">Driving</span>
            </button>
            <button
              onClick={() => handleTransportChange("walking")}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl border-2 transition-all ${
                selectedTransport === "walking"
                  ? "border-pink-500 bg-pink-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="w-12 h-12 bg-pink-200 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-pink-600" />
              </div>
              <span className="text-lg font-semibold text-gray-900">Walking</span>
            </button>
            <button
              onClick={() => handleTransportChange("public")}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl border-2 transition-all ${
                selectedTransport === "public"
                  ? "border-pink-500 bg-pink-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="w-12 h-12 bg-pink-200 rounded-full flex items-center justify-center">
                <Bus className="w-6 h-6 text-pink-600" />
              </div>
              <span className="text-lg font-semibold text-gray-900">Public Transport</span>
            </button>
          </div>
        </div>

        {/* Start Trip Button */}
        <button 
          onClick={calculateRoute}
          disabled={isCalculatingRoute || !selectedLocation || !selectedTransport}
          className="w-full py-5 bg-gray-900 text-white rounded-2xl text-lg font-semibold hover:bg-gray-800 transition-colors mb-10 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isCalculatingRoute ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Calculating Route...
            </>
          ) : (
            'Start Trip'
          )}
        </button>

        {/* Emergency Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Feeling Unsafe?</h2>
          <button className="w-full py-5 bg-red-500 text-white rounded-2xl text-lg font-semibold hover:bg-red-600 transition-colors flex items-center justify-center gap-2 shadow-lg">
            <AlertTriangle className="w-5 h-5" />
            Notify Emergency Contact!
          </button>
        </div>
      </main>
    </div>
  );
}
