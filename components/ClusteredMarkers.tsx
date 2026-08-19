import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { MarkerClusterer, Marker } from '@googlemaps/markerclusterer';
import { EatingJoint } from '../types';

type Spot = EatingJoint & { distanceKm?: number | null };

interface ClusteredMarkersProps {
  spots: Spot[];
  onSelectSpot: (spot: Spot) => void;
}

export default function ClusteredMarkers({ spots, onSelectSpot }: ClusteredMarkersProps) {
  const map = useMap();
  const [markers, setMarkers] = useState<Record<string, Marker>>({});
  const clusterer = useRef<MarkerClusterer | null>(null);

  useEffect(() => {
    if (!map) return;
    if (!clusterer.current) {
      clusterer.current = new MarkerClusterer({ map });
    }
  }, [map]);

  useEffect(() => {
    clusterer.current?.clearMarkers();
    clusterer.current?.addMarkers(Object.values(markers));
  }, [markers]);

  const setMarkerRef = useCallback((marker: Marker | null, id: string) => {
    setMarkers((prev) => {
      if ((marker && prev[id]) || (!marker && !prev[id])) return prev;

      if (marker) {
        return { ...prev, [id]: marker };
      }

      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  return (
    <>
      {spots.map((spot) => (
        <AdvancedMarker
          key={spot.id}
          position={{ lat: spot.lat, lng: spot.lng }}
          ref={(marker) => setMarkerRef(marker, spot.id)}
          onClick={() => onSelectSpot(spot)}
        />
      ))}
    </>
  );
}
