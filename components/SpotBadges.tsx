import React from 'react';
import { DietaryTag, LocationType, PodFeature } from '../types';

const DIETARY_LABELS: Record<DietaryTag, string> = {
  vegan: '🌱 Vegan',
  pure_veg: '🥦 Pure Veg',
  jain: '✨ Jain',
  halal: '🌙 Halal',
  non_veg: '🍗 Non-Veg'
};

const LOCATION_LABELS: Record<LocationType, string> = {
  beachfront: '🏖️ Near Beach',
  mall: '🛍️ In Mall',
  gas_station: '⛽ Gas Station',
  drive_thru: '🚗 Drive-Thru'
};

const POD_LABELS: Record<PodFeature, string> = {
  wheelchair_ramp: 'Wheelchair Ramp',
  pod_parking: 'POD Parking',
  baby_changing: 'Changing Table',
  highchair: 'Highchairs'
};

interface SpotBadgesProps {
  dietaryTags?: DietaryTag[] | null;
  podFeatures?: PodFeature[] | null;
  locationType?: LocationType | null;
}

export default function SpotBadges({ dietaryTags, podFeatures, locationType }: SpotBadgesProps) {
  const hasBadges = (dietaryTags && dietaryTags.length > 0) || (podFeatures && podFeatures.length > 0) || locationType;
  if (!hasBadges) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {locationType && (
        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
          {LOCATION_LABELS[locationType]}
        </span>
      )}
      {dietaryTags?.map((tag) => (
        <span key={tag} className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
          {DIETARY_LABELS[tag]}
        </span>
      ))}
      {podFeatures?.map((feature) => (
        <span key={feature} className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
          {POD_LABELS[feature]}
        </span>
      ))}
    </div>
  );
}
