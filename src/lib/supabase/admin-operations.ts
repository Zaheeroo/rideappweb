import { supabase } from '@/lib/supabase';
import type { TripType } from '@/lib/types';

export type { TripType };

export interface DriverProfile {
  license_number: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_color: string;
  vehicle_plate: string;
  is_active: boolean;
}

export interface Driver {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  avatar_url?: string;
  driver_profile: DriverProfile;
  rating: number;
  total_trips: number;
}

export async function getAllDrivers(): Promise<Driver[]> {
  const response = await fetch('/api/admin/drivers');
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch drivers');
  }
  return response.json();
}

export async function addDriver(driverData: {
  email: string;
  password: string;
  full_name: string;
  phone_number: string;
  license_number: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_color: string;
  vehicle_plate: string;
}): Promise<void> {
  const response = await fetch('/api/admin/drivers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(driverData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create driver');
  }
}

export async function addDriverTag(driverId: string, tag: string): Promise<void> {
  const { data: userData, error: authError } = await supabase.auth.getUser();
  
  if (authError) throw new Error('Authentication error');
  if (!userData?.user) throw new Error('No authenticated user');

  try {
    const { error } = await supabase
      .from('driver_tags')
      .insert({ driver_id: driverId, tag });

    if (error) throw error;
  } catch (error) {
    console.error('Error adding driver tag:', error);
    throw new Error('Failed to add driver tag');
  }
}

export interface AdminStats {
  totalTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  totalRevenue: number;
  activeDrivers: number;
  averageRating: number;
}

export interface PopularDestination {
  location: string;
  count: number;
  totalRevenue: number;
}

export async function getAdminStats(timeframe: 'day' | 'week' | 'month' | 'year'): Promise<AdminStats> {
  const { data: userData, error: authError } = await supabase.auth.getUser();
  
  if (authError) throw new Error('Authentication error');
  if (!userData?.user) throw new Error('No authenticated user');

  try {
    const startDate = new Date();
    switch (timeframe) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    const { data: trips, error: tripsError } = await supabase
      .from('trips')
      .select('status, cost, rating')
      .gte('created_at', startDate.toISOString());

    if (tripsError) throw tripsError;

    const { count: activeDrivers, error: driversError } = await supabase
      .from('driver_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (driversError) throw driversError;

    const stats = (trips || []).reduce((acc, trip) => ({
      totalTrips: acc.totalTrips + 1,
      completedTrips: acc.completedTrips + (trip.status === 'completed' ? 1 : 0),
      cancelledTrips: acc.cancelledTrips + (trip.status === 'cancelled' ? 1 : 0),
      totalRevenue: acc.totalRevenue + (trip.cost || 0),
      totalRating: acc.totalRating + (trip.rating || 0),
      ratedTrips: acc.ratedTrips + (trip.rating ? 1 : 0),
    }), {
      totalTrips: 0,
      completedTrips: 0,
      cancelledTrips: 0,
      totalRevenue: 0,
      totalRating: 0,
      ratedTrips: 0,
    });

    return {
      ...stats,
      activeDrivers: activeDrivers || 0,
      averageRating: stats.ratedTrips > 0 ? stats.totalRating / stats.ratedTrips : 0,
    };
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    throw new Error('Failed to fetch admin statistics');
  }
}

export async function getPopularDestinations(timeframe: 'week' | 'month' | 'year'): Promise<PopularDestination[]> {
  const { data: userData, error: authError } = await supabase.auth.getUser();
  
  if (authError) throw new Error('Authentication error');
  if (!userData?.user) throw new Error('No authenticated user');

  try {
    const startDate = new Date();
    switch (timeframe) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    const { data: trips, error } = await supabase
      .from('trips')
      .select('dropoff_location, cost')
      .gte('created_at', startDate.toISOString())
      .not('dropoff_location', 'is', null);

    if (error) throw error;

    const destinations = (trips || []).reduce((acc, trip) => {
      const location = trip.dropoff_location;
      if (!acc[location]) {
        acc[location] = { count: 0, totalRevenue: 0 };
      }
      acc[location].count++;
      acc[location].totalRevenue += trip.cost || 0;
      return acc;
    }, {} as Record<string, { count: number; totalRevenue: number }>);

    return Object.entries(destinations)
      .map(([location, stats]) => ({
        location,
        count: stats.count,
        totalRevenue: stats.totalRevenue,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  } catch (error) {
    console.error('Error fetching popular destinations:', error);
    throw new Error('Failed to fetch popular destinations');
  }
}

export async function updateDriverStatus(driverId: string, isActive: boolean): Promise<void> {
  const { data: userData, error: authError } = await supabase.auth.getUser();
  
  if (authError) throw new Error('Authentication error');
  if (!userData?.user) throw new Error('No authenticated user');

  try {
    // First, ensure the driver has a driver_profiles record
    const { data: existingProfile, error: profileError } = await supabase
      .from('driver_profiles')
      .select('*')
      .eq('user_id', driverId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error checking driver profile:', profileError);
      throw new Error('Failed to check driver profile');
    }

    if (!existingProfile) {
      // Create a driver_profiles record if it doesn't exist
      const { error: createError } = await supabase
        .from('driver_profiles')
        .insert({
          user_id: driverId,
          is_active: isActive,
        });

      if (createError) {
        console.error('Error creating driver profile:', createError);
        throw new Error('Failed to create driver profile');
      }
    } else {
      // Update the existing driver_profiles record
      const { error: updateError } = await supabase
        .from('driver_profiles')
        .update({ is_active: isActive })
        .eq('user_id', driverId);

      if (updateError) {
        console.error('Error updating driver status:', updateError);
        throw new Error('Failed to update driver status');
      }
    }
  } catch (error) {
    console.error('Error in updateDriverStatus:', error);
    throw error;
  }
}

export async function updateDriver(driverId: string, driverData: {
  full_name?: string;
  phone_number?: string;
  license_number?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  vehicle_color?: string;
  vehicle_plate?: string;
  is_active?: boolean;
}): Promise<void> {
  const response = await fetch('/api/admin/drivers', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ driverId, ...driverData }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update driver');
  }
}

export async function removeDriver(driverId: string): Promise<Response> {
  const response = await fetch(`/api/admin/drivers?id=${driverId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to remove driver');
  }

  return response;
}

export interface DriverStats {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  avatar_url?: string;
  total_trips: number;
  completed_trips: number;
  cancelled_trips: number;
  total_revenue: number;
  average_rating: number;
  is_active: boolean;
  license_number: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_color: string;
  vehicle_plate: string;
  tags: string[];
}

export async function getDriverStats(): Promise<DriverStats[]> {
  const { data: userData, error: authError } = await supabase.auth.getUser();
  
  if (authError) throw new Error('Authentication error');
  if (!userData?.user) throw new Error('No authenticated user');

  try {
    // Get all drivers with basic info first
    const { data: drivers, error } = await supabase
      .from('user_profiles')
      .select(`
        id,
        full_name,
        email,
        phone_number,
        avatar_url,
        driver_profiles (*)
      `)
      .eq('role', 'driver');

    if (error) {
      console.error('Error fetching drivers:', error);
      throw new Error('Failed to fetch driver statistics');
    }

    if (!drivers) {
      return [];
    }

    // Map the results to the expected format
    return drivers.map((driver: any) => {
      const driverProfile = Array.isArray(driver.driver_profiles) 
        ? driver.driver_profiles[0] 
        : driver.driver_profiles;

      return {
        id: driver.id,
        full_name: driver.full_name,
        email: driver.email,
        phone_number: driver.phone_number || '',
        avatar_url: driver.avatar_url,
        total_trips: 0,
        completed_trips: 0,
        cancelled_trips: 0,
        total_revenue: 0,
        average_rating: 0,
        is_active: driverProfile?.is_active || false,
        license_number: driverProfile?.license_number || '',
        vehicle_make: driverProfile?.vehicle_make || '',
        vehicle_model: driverProfile?.vehicle_model || '',
        vehicle_year: driverProfile?.vehicle_year || 0,
        vehicle_color: driverProfile?.vehicle_color || '',
        vehicle_plate: driverProfile?.vehicle_plate || '',
        tags: []
      };
    });
  } catch (error) {
    console.error('Error fetching driver stats:', error);
    throw new Error('Failed to fetch driver statistics');
  }
}

export async function removeDriverTag(driverId: string, tag: string): Promise<void> {
  const { data: userData, error: authError } = await supabase.auth.getUser();
  
  if (authError) throw new Error('Authentication error');
  if (!userData?.user) throw new Error('No authenticated user');

  try {
    const { error } = await supabase
      .from('driver_tags')
      .delete()
      .eq('driver_id', driverId)
      .eq('tag', tag);

    if (error) throw error;
  } catch (error) {
    console.error('Error removing driver tag:', error);
    throw new Error('Failed to remove driver tag');
  }
}

export type TripStatus = 'scheduled' | 'en-route' | 'completed' | 'cancelled';

export interface DetailedTrip {
  id: string;
  user_id: string;
  driver_id?: string;
  driver?: {
    id: string;
    full_name: string;
    phone_number?: string;
    email?: string;
    avatar_url?: string;
    driver_profile: DriverProfile;
  };
  trip_type: TripType;
  status: TripStatus;
  pickup_time: string;
  dropoff_time?: string;
  pickup_location: string;
  dropoff_location?: string;
  flight_number?: string;
  hours?: number;
  cost: number;
  rating?: number;
  reviewed: boolean;
  created_at: string;
  updated_at: string;
}

export async function getTrips(): Promise<DetailedTrip[]> {
  const { data: userData, error: authError } = await supabase.auth.getUser();
  
  if (authError) throw new Error('Authentication error');
  if (!userData?.user) throw new Error('No authenticated user');

  try {
    const { data, error } = await supabase
      .from('trips')
      .select(`
        *,
        customer:user_profiles!user_id(
          full_name,
          email,
          avatar_url
        ),
        driver:user_profiles!driver_id(
          full_name,
          email,
          avatar_url,
          driver_profile:driver_profiles(
            vehicle_make,
            vehicle_model,
            vehicle_plate
          )
        )
      `)
      .order('pickup_time', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching trips:', error);
    throw new Error('Failed to fetch trips');
  }
}

export async function updateTripStatus(tripId: string, status: TripStatus): Promise<void> {
  const { data: userData, error: authError } = await supabase.auth.getUser();
  
  if (authError) throw new Error('Authentication error');
  if (!userData?.user) throw new Error('No authenticated user');

  try {
    const { error } = await supabase
      .from('trips')
      .update({ status })
      .eq('id', tripId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating trip status:', error);
    throw new Error('Failed to update trip status');
  }
}

export async function assignDriverToTrip(tripId: string, driverId: string): Promise<void> {
  const { data: userData, error: authError } = await supabase.auth.getUser();
  
  if (authError) throw new Error('Authentication error');
  if (!userData?.user) throw new Error('No authenticated user');

  try {
    const { error } = await supabase
      .from('trips')
      .update({ driver_id: driverId })
      .eq('id', tripId);

    if (error) throw error;
  } catch (error) {
    console.error('Error assigning driver:', error);
    throw new Error('Failed to assign driver');
  }
}

export async function removeDriverFromTrip(tripId: string): Promise<void> {
  const { data: userData, error: authError } = await supabase.auth.getUser();
  
  if (authError) throw new Error('Authentication error');
  if (!userData?.user) throw new Error('No authenticated user');

  try {
    const { error } = await supabase
      .from('trips')
      .update({ 
        driver_id: null,
        status: 'scheduled'
      })
      .eq('id', tripId);

    if (error) throw error;
  } catch (error) {
    console.error('Error removing driver:', error);
    throw new Error('Failed to remove driver');
  }
}