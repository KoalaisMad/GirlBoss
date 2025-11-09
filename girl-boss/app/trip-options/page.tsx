// Trip options page - shows you different ways to get somewhere
// this one was kinda tricky because of the Google Maps API
// spent like 2 hours debugging the directions renderer lol

"use client";

import { useEffect, useState, useRef, Suspense } from "react";
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
  altIndex?: number;
  route?: any;
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

function TripPageContent() {
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

        // Get battery status if available
        let batteryPercent = 80;
        let isCharging = false;
        if ('getBattery' in navigator) {
          try {
            const battery = await (navigator as any).getBattery();
            batteryPercent = Math.round(battery.level * 100);
            isCharging = battery.charging;
          } catch (e) {
            console.log('Battery API not available');
          }
        }

        // Fetch all routes for all modes
        const results = await Promise.all(
          modes.map(async (mode) => {
            try {
              // Fetch route data
              const routeResponse = await fetch("/api/route", {
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
              const routeData = await routeResponse.json();

              // Extract waypoints from the route for detailed safety analysis
              let waypoints: Array<{latitude: number, longitude: number}> = [];
              if (routeResponse.ok && routeData.routes && routeData.routes[0]?.legs) {
                const leg = routeData.routes[0].legs[0];
                if (leg.steps && leg.steps.length > 0) {
                  // Sample waypoints from route steps (every 2-3 steps to avoid too many API calls)
                  const stepInterval = Math.max(1, Math.floor(leg.steps.length / 5)); // Max 5 waypoints
                  leg.steps.forEach((step: any, idx: number) => {
                    if (idx % stepInterval === 0 && step.end_location) {
                      waypoints.push({
                        latitude: step.end_location.lat,
                        longitude: step.end_location.lng
                      });
                    }
                  });
                }
              }
              
              console.log(`Extracted ${waypoints.length} waypoints for ${mode} route`);

              // Fetch safety score from backend with route waypoints for Databricks analysis
              let safetyScore = 50; // default
              try {
                const safetyResponse = await fetch("http://localhost:4000/api/plan/route-safety-score", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    startLat,
                    startLon,
                    endLat,
                    endLon,
                    waypoints, // Include route waypoints for comprehensive analysis
                    battery_percent: batteryPercent,
                    is_charging: isCharging,
                    transport_mode: mode, // Pass the transport mode
                  }),
                });
                
                if (safetyResponse.ok) {
                  const safetyData = await safetyResponse.json();
                  safetyScore = safetyData.score;
                  console.log(`✅ Safety score for ${mode}: ${safetyScore} (analyzed ${safetyData.route_segments_analyzed || 0} segments with Databricks)`);
                } else {
                  console.error(`❌ Safety API error for ${mode}:`, safetyResponse.status, await safetyResponse.text());
                }
              } catch (err) {
                console.error(`❌ Failed to fetch safety score for ${mode}:`, err);
              }

              return { 
                mode, 
                data: routeResponse.ok ? routeData : null,
                safetyScore 
              };
            } catch (err) {
              console.error(`Error fetching ${mode} route:`, err);
              return { mode, data: null, safetyScore: 50 };
            }
          })
        );

        // Flatten all walking alternatives, keep one for other modes
        let options: TripOption[] = [];
        for (const result of results) {
          if (!result.data || !result.data.routes) continue;
          const routes = result.mode === 'walking' ? result.data.routes : [result.data.routes[0]];
          routes.forEach((route: any, idx: number) => {
            const arrivalTime = new Date(Date.now() + route.duration * 1000);
            const hours = arrivalTime.getHours();
            const minutes = arrivalTime.getMinutes();
            const period = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12;
            const durationMinutes = Math.floor(route.duration / 60);
            options.push({
              mode: result.mode,
              icon: result.mode === 'walking' ? User : result.mode === 'driving' ? Car : Bus,
              time: `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`,
              duration: `${durationMinutes} min`,
              safetyScore: result.safetyScore,
              altIndex: result.mode === 'walking' ? idx + 1 : undefined,
              route,
            });
          });
        }

        setTripOptions(options);
        
        // (No need to set selectedRoute for alternatives display)
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

      // Render only the route for the trip with the best safety score
      const directionsService = new window.google.maps.DirectionsService();
      
      // Find the best safety score option
      const bestOption = tripOptions.length > 0 
        ? tripOptions.reduce((prev, current) => 
            current.safetyScore > prev.safetyScore ? current : prev
          )
        : null;

      if (bestOption) {
        const modeMap: { [key: string]: string } = {
          'walking': 'WALKING',
          'driving': 'DRIVING',
          'public': 'TRANSIT'
        };

        const travelMode = modeMap[bestOption.mode] || 'DRIVING';
        
        const directionsRenderer = new window.google.maps.DirectionsRenderer({
          map,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: "#EC4899", // pink for the safest route
            strokeWeight: 5,
            strokeOpacity: 1,
          },
        });

        directionsService.route(
          {
            origin: { lat: startLat, lng: startLon },
            destination: { lat: endLat, lng: endLon },
            travelMode: window.google.maps.TravelMode[travelMode as keyof typeof window.google.maps.TravelMode],
          },
          (result: any, status: any) => {
            const okStatus = status === "OK" || status === window.google.maps.DirectionsStatus.OK;
            if (okStatus && result) {
              directionsRenderer.setDirections(result);
              // Fit bounds to show the entire route
              const bounds = new window.google.maps.LatLngBounds();
              result.routes[0]?.overview_path?.forEach((p: any) => bounds.extend(p));
              map.fitBounds(bounds);
            } else {
              console.warn(`Directions request failed for ${travelMode}:`, status);
            }
          }
        );
      }
  }, [startLat, startLon, endLat, endLon, destination, transport, mapsLoaded, mapsError, tripOptions]);

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
              {tripOptions.map((option, index) => {
                // Build Google Maps URL for this mode
                const travelMode = option.mode === 'public' ? 'transit' : option.mode;
                const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${startLat},${startLon}&destination=${endLat},${endLon}&travelmode=${travelMode}`;
                return (
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
                      <p className="text-gray-600 text-sm">
                        {option.time} 
                      </p>
                      <p className="text-gray-600 text-sm">
                        {option.duration}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-600 text-sm">Safety Score</p>
                      <p className={`text-2xl font-semibold ${
                        option.safetyScore >= 90 ? 'text-green-600' :      // Excellent
                        option.safetyScore >= 70 ? 'text-pink-500' :       // Good
                        option.safetyScore >= 50 ? 'text-orange-500' :     // Moderate
                        option.safetyScore >= 30 ? 'text-red-500' :        // Poor
                        'text-red-700'                                      // Dangerous
                      }`}>
                        {option.safetyScore}
                      </p>
                      <button
                        onClick={() => window.open(mapsUrl, '_blank')}
                        className="mt-2 bg-pink-100 hover:bg-pink-200 text-pink-700 px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                      >
                        Open in Google Maps
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recommended Trip Mode */}
            <div className="mb-2">
              <div className="flex items-center justify-between ">
                <h2 className="text-lg font-semibold text-gray-900">Recommended Trip Mode</h2>
                <span className="text-pink-500 font-semibold">{getRecommendedMode()}</span>
              </div>
            </div>

            {/* Map - Show route for best safety score */}
            <div className="mb-8">
              <div 
                ref={mapRef}
                className="w-full h-[400px] rounded-2xl border-2 border-gray-200 overflow-hidden"
              >
                {mapInitError && (
                  <div className="flex items-center justify-center h-full bg-gray-50">
                    <p className="text-red-500 text-sm px-4 text-center">{mapInitError}</p>
                  </div>
                )}
                {mapsError && (
                  <div className="flex items-center justify-center h-full bg-gray-50">
                    <p className="text-red-500 text-sm px-4 text-center">{mapsError}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function TripPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <TripPageContent />
    </Suspense>
  );
}
