import React, { useEffect, useMemo, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import {
  Navigation,
  Loader2,
  Compass,
  SlidersHorizontal,
  MapPin,
  Accessibility,
  UtensilsCrossed
} from 'lucide-react';
import { EatingJoint, DietaryTag, LocationType, PodFeature } from '../types';
import { fetchJoints, fetchJointsWithinRadius } from '../lib/joints';
import { calculateDistanceKm } from '../utils/geo';
import ClusteredMarkers from './ClusteredMarkers';
import SpotBadges from './SpotBadges';

type Spot = EatingJoint & { distanceKm?: number | null };

const DEFAULT_CENTER = { lat: 25.2048, lng: 55.2708 }; // Dubai default
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

interface MapRecenterProps {
  center: { lat: number; lng: number } | null;
}

function MapRecenter({ center }: MapRecenterProps) {
  const map = useMap();
  useEffect(() => {
    if (map && center) {
      map.panTo(center);
      map.setZoom(13);
    }
  }, [map, center]);
  return null;
}

interface FilterState {
  radiusKm: number;
  dietaryTags: DietaryTag[];
  locationTypes: LocationType[];
  podFeatures: PodFeature[];
}

const DIETARY_OPTIONS: { id: DietaryTag; label: string }[] = [
  { id: 'vegan', label: '🌱 Vegan' },
  { id: 'pure_veg', label: '🥦 Pure Veg' },
  { id: 'jain', label: '✨ Jain' },
  { id: 'halal', label: '🌙 Halal' },
  { id: 'non_veg', label: '🍗 Non-Veg' }
];

const LOCATION_OPTIONS: { id: LocationType; label: string }[] = [
  { id: 'beachfront', label: '🏖️ Near Beach' },
  { id: 'mall', label: '🛍️ In Mall' },
  { id: 'gas_station', label: '⛽ Gas Station' },
  { id: 'drive_thru', label: '🚗 Drive-Thru' }
];

const POD_OPTIONS: { id: PodFeature; label: string }[] = [
  { id: 'wheelchair_ramp', label: 'Wheelchair Ramp' },
  { id: 'pod_parking', label: 'POD Parking' },
  { id: 'baby_changing', label: 'Changing Table' },
  { id: 'highchair', label: 'Highchairs' }
];

export default function DirectoryMapView() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [centerTarget, setCenterTarget] = useState<{ lat: number; lng: number } | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    radiusKm: 10,
    dietaryTags: [],
    locationTypes: [],
    podFeatures: []
  });

  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(userCoords);
        setCenterTarget(userCoords);
        setGeoLoading(false);
      },
      (error) => {
        console.error('GPS error:', error);
        alert('Unable to retrieve location. Check browser permissions.');
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    fetchSpots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation, filters.radiusKm]);

  const fetchSpots = async () => {
    try {
      if (userLocation) {
        const data = await fetchJointsWithinRadius({
          userLat: userLocation.lat,
          userLng: userLocation.lng,
          radiusKm: filters.radiusKm,
          dietaryTags: filters.dietaryTags,
          podFeatures: filters.podFeatures,
          locationTypes: filters.locationTypes
        });
        setSpots(data);
      } else {
        const data = await fetchJoints();
        setSpots(data.filter((j) => j.status === 'approved'));
      }
    } catch (err) {
      console.error('Error fetching spots:', err);
    }
  };

  const filteredSpots = useMemo(() => {
    return spots.filter((spot) => {
      const matchesDietary =
        filters.dietaryTags.length === 0 ||
        filters.dietaryTags.some((tag) => spot.dietaryTags.includes(tag));

      const matchesLocation =
        filters.locationTypes.length === 0 ||
        (spot.locationType !== null && filters.locationTypes.includes(spot.locationType));

      const matchesPod =
        filters.podFeatures.length === 0 ||
        filters.podFeatures.every((f) => spot.podFeatures.includes(f));

      return matchesDietary && matchesLocation && matchesPod;
    });
  }, [spots, filters]);

  const toggleFilterItem = <K extends 'dietaryTags' | 'locationTypes' | 'podFeatures'>(
    key: K,
    value: FilterState[K][number]
  ) => {
    setFilters((prev) => {
      const current = prev[key] as FilterState[K][number][];
      const updated = current.includes(value)
        ? current.filter((i) => i !== value)
        : [...current, value];
      return { ...prev, [key]: updated };
    });
  };

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="w-full h-[720px] rounded-2xl border border-slate-800 bg-slate-900 flex items-center justify-center text-center p-8">
        <div>
          <MapPin className="w-10 h-10 mx-auto text-amber-400 mb-3" />
          <h3 className="text-slate-200 font-bold mb-1">Map view needs a Google Maps API key</h3>
          <p className="text-slate-400 text-sm max-w-sm">
            Set <code className="text-amber-400">VITE_GOOGLE_MAPS_API_KEY</code> in your .env to enable it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[720px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 flex flex-col md:flex-row">
      <div className="w-full md:w-80 p-4 bg-slate-900 border-r border-slate-800 space-y-4 overflow-y-auto z-10 shrink-0">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
          </h3>
          <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-mono font-bold">
            {filteredSpots.length} spots
          </span>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-300">
            <span>Radius Limit</span>
            <span className="text-amber-400 font-mono">{filters.radiusKm} km</span>
          </div>
          <input
            type="range"
            min={1}
            max={50}
            step={1}
            value={filters.radiusKm}
            disabled={!userLocation}
            onChange={(e) => setFilters((prev) => ({ ...prev, radiusKm: Number(e.target.value) }))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 disabled:opacity-30"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 flex items-center gap-1 mb-2">
            <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" />
            <span>Dietary Preferences</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {DIETARY_OPTIONS.map((diet) => (
              <button
                key={diet.id}
                onClick={() => toggleFilterItem('dietaryTags', diet.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  filters.dietaryTags.includes(diet.id)
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                {diet.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 flex items-center gap-1 mb-2">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>Location Type</span>
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {LOCATION_OPTIONS.map((type) => (
              <button
                key={type.id}
                onClick={() => toggleFilterItem('locationTypes', type.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  filters.locationTypes.includes(type.id)
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 flex items-center gap-1 mb-2">
            <Accessibility className="w-3.5 h-3.5 text-blue-400" />
            <span>POD & Family</span>
          </label>
          <div className="flex flex-wrap gap-1">
            {POD_OPTIONS.map((feature) => (
              <button
                key={feature.id}
                onClick={() => toggleFilterItem('podFeatures', feature.id)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium border transition ${
                  filters.podFeatures.includes(feature.id)
                    ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                {feature.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative flex-1 w-full h-full">
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={handleLocateUser}
            disabled={geoLoading}
            className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 text-amber-400 border border-amber-500/30 px-3.5 py-2.5 rounded-xl text-xs font-bold shadow-2xl backdrop-blur-md transition"
          >
            {geoLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4 fill-amber-400/20" />
            )}
            <span>{userLocation ? 'Re-center Near Me' : 'Locate Me'}</span>
          </button>
        </div>

        <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
          <Map
            defaultCenter={DEFAULT_CENTER}
            defaultZoom={11}
            mapId="UAE_FOOD_DIRECTORY_MAP"
            gestureHandling="greedy"
            disableDefaultUI={true}
            className="w-full h-full"
          >
            <MapRecenter center={centerTarget} />

            {userLocation && (
              <AdvancedMarker position={userLocation} title="Your Location">
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-8 h-8 bg-blue-500/30 rounded-full animate-ping" />
                  <div className="w-5 h-5 bg-blue-500 border-2 border-white rounded-full shadow-lg" />
                </div>
              </AdvancedMarker>
            )}

            <ClusteredMarkers
              spots={filteredSpots}
              onSelectSpot={(spot) => {
                const distanceKm = userLocation
                  ? calculateDistanceKm(userLocation.lat, userLocation.lng, spot.lat, spot.lng)
                  : spot.distanceKm ?? null;

                setSelectedSpot({ ...spot, distanceKm });
              }}
            />

            {selectedSpot && (
              <InfoWindow
                position={{ lat: selectedSpot.lat, lng: selectedSpot.lng }}
                onCloseClick={() => setSelectedSpot(null)}
              >
                <div className="p-1 max-w-xs text-slate-900 font-sans">
                  {selectedSpot.image && (
                    <div className="h-24 w-full rounded-lg overflow-hidden mb-2 bg-slate-100">
                      <img src={selectedSpot.image} alt={selectedSpot.name} className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="font-extrabold text-sm">{selectedSpot.name}</h4>
                      <p className="text-xs text-slate-600 font-medium">{selectedSpot.specialty}</p>
                    </div>

                    {selectedSpot.distanceKm !== undefined && selectedSpot.distanceKm !== null && (
                      <span className="bg-amber-100 text-amber-900 font-black text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap flex items-center gap-1 shrink-0">
                        <Compass className="w-3 h-3 text-amber-600" />
                        {selectedSpot.distanceKm} km
                      </span>
                    )}
                  </div>

                  <SpotBadges
                    dietaryTags={selectedSpot.dietaryTags}
                    podFeatures={selectedSpot.podFeatures}
                    locationType={selectedSpot.locationType}
                  />
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </div>
    </div>
  );
}
