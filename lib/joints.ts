import { supabase } from './supabaseClient';
import { EatingJoint } from '../types';

interface JointRow {
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
  is_late_night: boolean;
  is_under_20: boolean;
  contributor: string;
  created_at: string;
}

const fromRow = (row: JointRow): EatingJoint => ({
  id: row.id,
  name: row.name,
  emirate: row.emirate,
  address: row.address,
  lat: row.lat,
  lng: row.lng,
  specialty: row.specialty,
  story: row.story,
  image: row.image,
  tags: row.tags,
  rating: row.rating,
  isLateNight: row.is_late_night,
  isUnder20: row.is_under_20,
  contributor: row.contributor,
  createdAt: row.created_at.split('T')[0]
});

export async function fetchJoints(): Promise<EatingJoint[]> {
  const { data, error } = await supabase
    .from('eating_joints')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as JointRow[]).map(fromRow);
}

export type NewJoint = Omit<EatingJoint, 'id' | 'createdAt'>;

export async function createJoint(joint: NewJoint): Promise<EatingJoint> {
  const { data, error } = await supabase
    .from('eating_joints')
    .insert({
      name: joint.name,
      emirate: joint.emirate,
      address: joint.address,
      lat: joint.lat,
      lng: joint.lng,
      specialty: joint.specialty,
      story: joint.story,
      image: joint.image,
      tags: joint.tags,
      rating: joint.rating,
      is_late_night: joint.isLateNight,
      is_under_20: joint.isUnder20,
      contributor: joint.contributor
    })
    .select()
    .single();

  if (error) throw error;
  return fromRow(data as JointRow);
}

export async function deleteJoint(id: string): Promise<void> {
  const { error } = await supabase.from('eating_joints').delete().eq('id', id);
  if (error) throw error;
}
