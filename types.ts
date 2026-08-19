
export type DietaryTag = 'vegan' | 'pure_veg' | 'jain' | 'halal' | 'non_veg';
export type LocationType = 'beachfront' | 'mall' | 'gas_station' | 'drive_thru';
export type PodFeature = 'wheelchair_ramp' | 'pod_parking' | 'baby_changing' | 'highchair';

export interface EatingJoint {
  id: string;
  name: string;
  emirate: string;
  address: string;
  lat: number;
  lng: number;
  specialty: string;
  story: string;
  image: string;
  tags: string[];
  rating: number;
  isLateNight: boolean;
  isUnder20: boolean;
  contributor: string;
  createdAt: string;
  dietaryTags: DietaryTag[];
  podFeatures: PodFeature[];
  locationType: LocationType | null;
  status: 'pending' | 'approved';
}

export interface MapSpot extends EatingJoint {
  distanceKm: number | null;
}
