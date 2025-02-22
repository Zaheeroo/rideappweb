import { supabase } from '@/lib/supabase';

export type TripType = 'airport' | 'point-to-point' | 'hourly';
export type TripStatus = 'scheduled' | 'en-route' | 'completed' | 'cancelled';

export interface DriverProfile {
  license_number: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_color: string;
  vehicle_plate: string;
  email?: string;
  avatar_url?: string;
}

export interface Trip {
  id: string;
  user_id: string;
  driver_id?: string;
  driver?: {
    full_name: string;
    phone_number?: string;
    email?: string;
    avatar_url?: string;
    driver_profile?: DriverProfile;
  };
  trip_type: TripType;
  status: TripStatus;
  pickup_time: string;
  pickup_location: string;
  dropoff_location?: string;
  flight_number?: string;
  hours?: number;
  cost?: number;
  rating?: number;
  reviewed: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTripInput {
  trip_type: TripType;
  pickup_time: string;
  pickup_location: string;
  dropoff_location?: string;
  flight_number?: string;
  hours?: number;
}

export async function createTrip(trip: CreateTripInput): Promise<Trip | null> {
  const { data: userData, error: authError } = await supabase.auth.getUser();
  
  if (authError) {
    console.error('Auth error:', authError);
    throw new Error('Authentication error');
  }

  if (!userData?.user) {
    throw new Error('No authenticated user');
  }

  try {
    // First check if user has a profile
    let { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        // Profile doesn't exist, create one
        const { data: newProfile, error: createProfileError } = await supabase
          .from('user_profiles')
          .insert({
            id: userData.user.id,
            role: 'customer',
            full_name: userData.user.user_metadata?.full_name || userData.user.email
          })
          .select()
          .single();

        if (createProfileError) {
          console.error('Create profile error:', createProfileError);
          throw new Error('Failed to create user profile');
        }

        userProfile = newProfile;
      } else {
        console.error('Profile error:', profileError);
        throw new Error('Error checking user profile');
      }
    }

    if (!userProfile) {
      throw new Error('Could not find or create user profile');
    }

    // Now create the trip
    const { data, error: tripError } = await supabase
      .from('trips')
      .insert({
        ...trip,
        user_id: userData.user.id,
        status: 'scheduled'
      })
      .select(`
        *,
        driver:user_profiles!driver_id(
          full_name,
          phone_number
        )
      `)
      .single();

    if (tripError) {
      console.error('Create trip error:', tripError);
      throw new Error(tripError.message);
    }

    return data;
  } catch (error) {
    console.error('Trip creation error:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unexpected error occurred');
    }
  }
}

export async function getUpcomingTrips(): Promise<Trip[]> {
  const { data: userData, error: authError } = await supabase.auth.getUser();
  
  if (authError) {
    console.error('Auth error:', authError);
    throw new Error('Authentication error');
  }

  if (!userData?.user) {
    throw new Error('No authenticated user');
  }

  const { data, error } = await supabase
    .from('trips')
    .select(`
      *,
      driver:user_profiles!driver_id(
        full_name,
        phone_number,
        email,
        avatar_url,
        driver_profile:driver_profiles(*)
      )
    `)
    .eq('user_id', userData.user.id)
    .in('status', ['scheduled', 'en-route'])
    .order('pickup_time', { ascending: true });

  if (error) {
    console.error('Fetch trips error:', error);
    throw new Error(error.message);
  }

  return data || [];
}

export async function getPastTrips(): Promise<Trip[]> {
  const { data: userData, error: authError } = await supabase.auth.getUser();
  
  if (authError) {
    console.error('Auth error:', authError);
    throw new Error('Authentication error');
  }

  if (!userData?.user) {
    throw new Error('No authenticated user');
  }

  const { data, error } = await supabase
    .from('trips')
    .select(`
      *,
      driver:user_profiles!driver_id(
        full_name,
        phone_number,
        email,
        avatar_url,
        driver_profile:driver_profiles(*)
      )
    `)
    .eq('user_id', userData.user.id)
    .in('status', ['completed', 'cancelled'])
    .order('pickup_time', { ascending: false });

  if (error) {
    console.error('Fetch trips error:', error);
    throw new Error(error.message);
  }

  return data || [];
}

export async function updateTripRating(tripId: string, rating: number): Promise<boolean> {
  const { data: userData, error: authError } = await supabase.auth.getUser();
  
  if (authError) {
    console.error('Auth error:', authError);
    throw new Error('Authentication error');
  }

  if (!userData?.user) {
    throw new Error('No authenticated user');
  }

  const { error } = await supabase
    .from('trips')
    .update({ rating, reviewed: true })
    .eq('id', tripId)
    .eq('user_id', userData.user.id);

  if (error) {
    console.error('Update rating error:', error);
    throw new Error(error.message);
  }

  return true;
}

export async function cancelTrip(tripId: string, cancellationReason: string): Promise<boolean> {
  const { data: userData, error: authError } = await supabase.auth.getUser();
  
  if (authError) {
    console.error('Auth error:', authError);
    throw new Error('Authentication error');
  }

  if (!userData?.user) {
    throw new Error('No authenticated user');
  }

  if (!cancellationReason.trim()) {
    throw new Error('Please provide a reason for cancellation');
  }

  const { error } = await supabase
    .from('trips')
    .update({ 
      status: 'cancelled',
      cancellation_reason: cancellationReason.trim()
    })
    .eq('id', tripId)
    .eq('user_id', userData.user.id)
    .eq('status', 'scheduled'); // Only allow cancelling scheduled trips

  if (error) {
    console.error('Cancel trip error:', error);
    throw new Error(error.message);
  }

  return true;
}

export async function getTripDetails(tripId: string): Promise<Trip | null> {
  const { data: userData, error: authError } = await supabase.auth.getUser();
  
  if (authError) {
    console.error('Auth error:', authError);
    throw new Error('Authentication error');
  }

  if (!userData?.user) {
    throw new Error('No authenticated user');
  }

  const { data, error } = await supabase
    .from('trips')
    .select(`
      *,
      driver:user_profiles!driver_id(
        full_name,
        phone_number,
        email,
        avatar_url,
        driver_profile:driver_profiles(
          license_number,
          vehicle_make,
          vehicle_model,
          vehicle_year,
          vehicle_color,
          vehicle_plate,
          email,
          avatar_url
        )
      )
    `)
    .eq('id', tripId)
    .eq('user_id', userData.user.id)
    .single();

  if (error) {
    console.error('Fetch trip details error:', error);
    throw new Error(error.message);
  }

  return data;
} 