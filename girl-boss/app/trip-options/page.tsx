// Trip options page - shows you different ways to get somewhere
// this one was kinda tricky because of the Google Maps API
// spent like 2 hours debugging the directions renderer lol

"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Menu, User, Car, Bus } from "lucide-react";
import Image from "next/image";
import Navigation from "../components/Navigation";

interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
}

interface RouteInfo {
  distance: number;
  duration: number;
  steps: RouteStep[];
}

interface TripOption {
  mode: string;
  icon: any;
  time: string;
  duration: string;
  safetyScore: number;
}

declare global {
  interface Window {
    google: any;
  }
}

// Reusable hook to dynamically load Google Maps JS API on the client.
function useLoadGoogleMaps() {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If SDK already present, mark loaded.
    if (typeof window !== 'undefined' && (window as any).google && (window as any).google.maps) {
      setLoaded(true);
      return;
    }

    // If script already injected, attach listeners. Match either our marker or any maps.googleapis script.
    const existing = (document.querySelector('script[data-google-maps]') || document.querySelector('script[src*="maps.googleapis.com"]')) as HTMLScriptElement | null;
    if (existing) {
      const onLoad = () => {
        // Sometimes the script loads but window.google is not available due to API key / referrer issues.
        if ((window as any).google && (window as any).google.maps) {
          setLoaded(true);
        } else {
          setError('Google Maps script loaded but `window.google` is not available — check API key and referrer restrictions');
        }
      };
      const onError = () => setError('Failed to load Google Maps script');
      existing.addEventListener('load', onLoad);
      existing.addEventListener('error', onError);
      // If the SDK is already present on window, run check immediately
      if ((window as any).google && (window as any).google.maps) {
        onLoad();
      }
      return () => {
        existing.removeEventListener('load', onLoad);
        existing.removeEventListener('error', onError);
      };
    }

    // Inject script
    const script = document.createElement('script');
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) {
      setError('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not defined. Add it to .env.local and restart dev.');
      return;
    }
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places,directions`;
    script.async = true;
    script.defer = true;
    script.setAttribute('data-google-maps', '1');
    script.onload = () => {
      // Give the SDK a moment to initialize
      setTimeout(() => {
        if ((window as any).google && (window as any).google.maps) {
          setLoaded(true);
        } else {
          setError('Google Maps script loaded but `window.google` is not available — check API key and referrer restrictions');
        }
      }, 200);
    };
    script.onerror = () => setError('Failed to load Google Maps script');
    document.head.appendChild(script);

    // don't remove script on cleanup
    return () => {};
  }, []);

  return { loaded, error } as const;
}

export default function TripPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tripOptions, setTripOptions] = useState<TripOption[]>([]);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [mapInitError, setMapInitError] = useState<string | null>(null);

  const { loaded: mapsLoaded, error: mapsError } = useLoadGoogleMaps();

  const destination = searchParams.get("destination") || "Unknown";
  const transport = searchParams.get("transport") || "driving";
  const startLat = parseFloat(searchParams.get("startLat") || "0");
  const startLon = parseFloat(searchParams.get("startLon") || "0");
  const endLat = parseFloat(searchParams.get("endLat") || "0");
  const endLon = parseFloat(searchParams.get("endLon") || "0");

  useEffect(() => {
    const fetchAllRoutes = async () => {
      try {
        // Fetch routes for all transport modes
        const modes = ['walking', 'driving', 'public'];
        const results = await Promise.all(
          modes.map(async (mode) => {
            const response = await fetch("/api/route", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                startLat,
                startLon,
                endLat,
                endLon,
                transportMode: mode,
              }),
            });
            const data = await response.json();
            return { mode, data: response.ok ? data : null };
          })
        );

        // Calculate safety scores (mock implementation - you can replace with real algorithm)
        const calculateSafetyScore = (mode: string, duration: number) => {
          const baseScores: { [key: string]: number } = {
            walking: 67,
            driving: 94,
            public: 42,
          };
          return baseScores[mode] || 50;
        };

        const options: TripOption[] = results
          .filter(r => r.data)
          .map((result) => {
            const data = result.data!;
            const arrivalTime = new Date(Date.now() + data.duration * 1000);
            const hours = arrivalTime.getHours();
            const minutes = arrivalTime.getMinutes();
            const period = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12;
            
            const durationMinutes = Math.floor(data.duration / 60);
            
            return {
              mode: result.mode,
              icon: result.mode === 'walking' ? User : result.mode === 'driving' ? Car : Bus,
              time: `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`,
              duration: `${durationMinutes} min`,
              safetyScore: calculateSafetyScore(result.mode, data.duration),
            };
          });

        setTripOptions(options);
        
        // Set the route info for the selected transport
        const selectedRoute = results.find(r => r.mode === transport);
        if (selectedRoute && selectedRoute.data) {
          setRouteInfo(selectedRoute.data);
        }
      } catch (error) {
        console.error("Error fetching routes:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllRoutes();
  }, [startLat, startLon, endLat, endLon, transport]);

  // Initialize Google Map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    if (!mapsLoaded) {
      // Not loaded yet; surface any load error
      if (mapsError) setMapInitError(mapsError);
      return;
    }

    // maps SDK is available, initialize map once
    setMapInitError(null);

    let map: any = null;
    try {
      map = new window.google.maps.Map(mapRef.current!, {
        center: { lat: startLat, lng: startLon },
        zoom: 13,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      });
      mapInstanceRef.current = map;
    } catch (err: any) {
      console.error('Map initialization error:', err);
      setMapInitError(err?.message || String(err));
      return;
    }

      // Add markers
      new window.google.maps.Marker({
        position: { lat: startLat, lng: startLon },
        map,
        title: "Your Location",
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#3B82F6",
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeWeight: 2,
        },
      });

      new window.google.maps.Marker({
        position: { lat: endLat, lng: endLon },
        map,
        title: destination,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#EC4899",
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeWeight: 2,
        },
      });

      // Calculate routes for all modes
      const directionsService = new window.google.maps.DirectionsService();
      const modeColors = {
        DRIVING: "#3B82F6", // blue
        WALKING: "#10B981", // green
        TRANSIT: "#EC4899", // pink
      };

      const renderRoute = (mode: string) => {
        const directionsRenderer = new window.google.maps.DirectionsRenderer({
          map,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: modeColors[mode as keyof typeof modeColors] || "#EC4899",
            strokeWeight: 4,
            strokeOpacity: mode === transport.toUpperCase() ? 1 : 0.5, // highlight selected mode
          },
        });

        directionsService.route(
          {
            origin: { lat: startLat, lng: startLon },
            destination: { lat: endLat, lng: endLon },
            travelMode: window.google.maps.TravelMode[mode as keyof typeof window.google.maps.TravelMode],
          },
          (result: any, status: any) => {
            const okStatus = status === "OK" || status === window.google.maps.DirectionsStatus.OK;
            if (okStatus && result) {
              directionsRenderer.setDirections(result);
              // If this is the selected mode, fit bounds
              if (mode === transport.toUpperCase()) {
                const bounds = new window.google.maps.LatLngBounds();
                result.routes[0]?.overview_path?.forEach((p: any) => bounds.extend(p));
                map.fitBounds(bounds);
              }
            } else {
              console.warn(`Directions request failed for ${mode}:`, status);
            }
          }
        );
      };

    // Draw all routes, selected mode last so it's on top
    const modes = ['DRIVING', 'WALKING', 'TRANSIT'].sort(
      (a, b) => (a === transport.toUpperCase() ? 1 : 0) - (b === transport.toUpperCase() ? 1 : 0)
    );
    modes.forEach(renderRoute);
  }, [startLat, startLon, endLat, endLon, destination, transport, mapsLoaded, mapsError]);

  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${startLat},${startLon}&destination=${endLat},${endLon}&travelmode=${transport === 'walking' ? 'walking' : transport === 'public' ? 'transit' : 'driving'}`;
    window.open(url, '_blank');
  };

  const getModeName = (mode: string) => {
    return mode === 'walking' ? 'Walking' : mode === 'driving' ? 'Driving' : 'Bus';
  };

  const getRecommendedMode = () => {
    if (tripOptions.length === 0) return 'Driving';
    const best = tripOptions.reduce((prev, current) => 
      current.safetyScore > prev.safetyScore ? current : prev
    );
    return getModeName(best.mode);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation isOpen={isNavOpen} onClose={() => setIsNavOpen(false)} />
      
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <button onClick={() => router.push('/')} className="cursor-pointer hover:opacity-80 transition-opacity">
          <Image
            src="/girlboss.png"
            alt="GirlBoss Logo"
            width={150}
            height={150}
            className="rounded-lg"
          />
        </button>
        <button 
          onClick={() => setIsNavOpen(true)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6 text-gray-700" />
        </button>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-8 pt-12 py-8">
        {/* Title Section */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-semibold text-gray-900 mb-2 text-center">Trip Options</h1>
          <p className="text-pink-400 text">View your trip's safety score</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading trip options...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Trip Options Cards */}
            <div className="space-y-4 mb-8">
              {tripOptions.map((option, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-2 px-4 bg-white border-2 border-gray-200 rounded-2xl hover:border-pink-300 transition-colors"
                >
                  <div className="w-10 h-10 bg-pink-200 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <option.icon className="w-5 h-5 text-gray-900" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {getModeName(option.mode)}
                    </h3>
                    <p className="text-gray-600">
                      {option.time} · {option.duration}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-600 text-sm">Safety Score</p>
                    <p className={`text-2xl font-semibold ${
                      option.safetyScore >= 80 ? 'text-pink-500' : 
                      option.safetyScore >= 60 ? 'text-orange-500' : 
                      'text-red-500'
                    }`}>
                      {option.safetyScore}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Recommended Trip Mode */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-gray-900">Recommended Trip Mode</h2>
                <span className="text-pink-500 font-semibold">{getRecommendedMode()}</span>
              </div>
            </div>

            {/* Map */}
            <div className="bg-gray-100 rounded-3xl overflow-hidden h-96 relative">
              <div ref={mapRef} className="w-full h-full" data-debug-map />

              {/* Debug overlay to help diagnose SDK / init issues */}
              <div className="absolute top-4 right-4 bg-white bg-opacity-90 rounded px-3 py-2 text-xs shadow">
                <div className="font-medium">Map debug</div>
                <div>SDK Loaded: {mapsLoaded ? <span className="text-green-600">yes</span> : <span className="text-red-600">no</span>}</div>
                <div>Init error: {mapInitError ?? mapsError ?? 'none'}</div>
              </div>

              <button 
                onClick={openInGoogleMaps}
                className="absolute bottom-4 left-4 bg-white rounded-lg px-4 py-2 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
              >
                <p className="text-gray-600 text-sm font-medium">Open in Google Maps</p>
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
