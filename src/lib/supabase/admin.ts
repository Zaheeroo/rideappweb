import { createClient } from '@supabase/supabase-js';
import { Trip } from './trips';

// This file should only be imported in server-side code
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Debug logging
console.log('Supabase URL:', supabaseUrl);
console.log('Service Key exists:', !!supabaseServiceKey);

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables for admin operations');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export interface AdminAnalytics {
  totalTrips: number;
  totalDrivers: number;
  totalCustomers: number;
  totalRevenue: number;
  popularDestinations: {
    location: string;
    count: number;
  }[];
  recentReviews: {
    driver_name: string;
    rating: number;
    comment?: string;
    date: string;
  }[];
  tripsByStatus: {
    status: string;
    count: number;
  }[];
}

interface ReviewData {
  rating: number;
  created_at: string;
  driver: {
    full_name: string;
  } | null;
}

interface TripData {
  id: string;
  status: string;
  cost: number | null;
}

export async function getAdminAnalytics(timeframe: 'week' | 'month' | 'year'): Promise<AdminAnalytics> {
  const { data: userData, error: authError } = await supabaseAdmin.auth.getUser();
  
  if (authError) {
    throw new Error('Authentication error');
  }

  if (!userData?.user) {
    throw new Error('No authenticated user');
  }

  // Get the date range based on timeframe
  const now = new Date();
  let startDate = new Date();
  switch (timeframe) {
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
  }

  try {
    // Get total trips and revenue
    const { data: tripsData, error: tripsError } = await supabaseAdmin
      .from('trips')
      .select('id, status, cost')
      .gte('created_at', startDate.toISOString());

    if (tripsError) throw tripsError;

    // Get total drivers
    const { count: driversCount, error: driversError } = await supabaseAdmin
      .from('user_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'driver');

    if (driversError) throw driversError;

    // Get total customers
    const { count: customersCount, error: customersError } = await supabaseAdmin
      .from('user_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'customer');

    if (customersError) throw customersError;

    // Get popular destinations
    const { data: destinationsData, error: destinationsError } = await supabaseAdmin
      .from('trips')
      .select('dropoff_location')
      .not('dropoff_location', 'is', null)
      .gte('created_at', startDate.toISOString());

    if (destinationsError) throw destinationsError;

    // Count destinations
    const destinationCounts = (destinationsData || []).reduce((acc, trip) => {
      if (trip.dropoff_location) {
        acc[trip.dropoff_location] = (acc[trip.dropoff_location] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const popularDestinations = Object.entries(destinationCounts)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get recent reviews
    const { data: reviewsData, error: reviewsError } = await supabaseAdmin
      .from('trips')
      .select(`
        rating,
        driver:user_profiles!driver_id(
          full_name
        ),
        created_at
      `)
      .not('rating', 'is', null)
      .order('created_at', { ascending: false })
      .limit(6);

    if (reviewsError) throw reviewsError;

    // Count trips by status
    const tripsByStatus = (tripsData || []).reduce((acc, trip) => {
      acc[trip.status] = (acc[trip.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalRevenue = (tripsData || []).reduce((sum, trip) => sum + (trip.cost || 0), 0);

    return {
      totalTrips: tripsData?.length || 0,
      totalDrivers: driversCount || 0,
      totalCustomers: customersCount || 0,
      totalRevenue,
      popularDestinations,
      recentReviews: (reviewsData || []).map(review => ({
        driver_name: (review as unknown as ReviewData).driver?.full_name || 'Unknown Driver',
        rating: (review as unknown as ReviewData).rating,
        date: new Date((review as unknown as ReviewData).created_at).toLocaleDateString(),
      })),
      tripsByStatus: Object.entries(tripsByStatus).map(([status, count]) => ({
        status,
        count,
      })),
    };
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    throw new Error('Failed to fetch analytics data');
  }
}

export async function getAllTrips(
  status?: string,
  startDate?: string,
  endDate?: string
): Promise<Trip[]> {
  const { data: userData, error: authError } = await supabaseAdmin.auth.getUser();
  
  if (authError) {
    throw new Error('Authentication error');
  }

  if (!userData?.user) {
    throw new Error('No authenticated user');
  }

  let query = supabaseAdmin
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
    .order('pickup_time', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (startDate) {
    query = query.gte('pickup_time', startDate);
  }

  if (endDate) {
    query = query.lte('pickup_time', endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching trips:', error);
    throw new Error(error.message);
  }

  return data || [];
}

export async function assignDriverToTrip(tripId: string, driverId: string): Promise<void> {
  const { data: userData, error: authError } = await supabaseAdmin.auth.getUser();
  
  if (authError) {
    throw new Error('Authentication error');
  }

  if (!userData?.user) {
    throw new Error('No authenticated user');
  }

  const { error } = await supabaseAdmin
    .from('trips')
    .update({ driver_id: driverId })
    .eq('id', tripId)
    .eq('status', 'scheduled');

  if (error) {
    console.error('Error assigning driver:', error);
    throw new Error(error.message);
  }
}

interface DriverWithTrips {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  avatar_url?: string;
  driver_profile: {
    license_number: string;
    vehicle_make: string;
    vehicle_model: string;
    vehicle_year: number;
    vehicle_color: string;
    vehicle_plate: string;
  } | null;
  trips: {
    rating: number | null;
  }[];
}

export async function getAllDrivers(): Promise<any[]> {
  const { data: userData, error: authError } = await supabaseAdmin.auth.getUser();
  
  if (authError) {
    throw new Error('Authentication error');
  }

  if (!userData?.user) {
    throw new Error('No authenticated user');
  }

  // Get all drivers with their profiles and average ratings
  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .select(`
      *,
      driver_profile:driver_profiles(*),
      trips!driver_id(
        rating
      )
    `)
    .eq('role', 'driver');

  if (error) {
    console.error('Error fetching drivers:', error);
    throw new Error(error.message);
  }

  // Calculate average rating and total trips for each driver
  return (data as DriverWithTrips[]).map(driver => {
    const trips = driver.trips || [];
    const ratings = trips
      .filter((t): t is { rating: number } => t.rating !== null)
      .map(t => t.rating);
    const averageRating = ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0;

    return {
      ...driver,
      rating: averageRating,
      total_trips: trips.length,
    };
  });
}

export async function createDriver(driverData: {
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
  const { data: userData, error: authError } = await supabaseAdmin.auth.getUser();
  
  if (authError) {
    throw new Error('Authentication error');
  }

  if (!userData?.user) {
    throw new Error('No authenticated user');
  }

  try {
    // Create auth user
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.signUp({
      email: driverData.email,
      password: driverData.password,
      options: {
        data: {
          full_name: driverData.full_name,
          role: 'driver',
        },
      },
    });

    if (signUpError) throw signUpError;
    if (!authData.user) throw new Error('Failed to create user');

    // Create user profile
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        full_name: driverData.full_name,
        phone_number: driverData.phone_number,
        role: 'driver',
      });

    if (profileError) throw profileError;

    // Create driver profile
    const { error: driverProfileError } = await supabaseAdmin
      .from('driver_profiles')
      .insert({
        user_id: authData.user.id,
        license_number: driverData.license_number,
        vehicle_make: driverData.vehicle_make,
        vehicle_model: driverData.vehicle_model,
        vehicle_year: driverData.vehicle_year,
        vehicle_color: driverData.vehicle_color,
        vehicle_plate: driverData.vehicle_plate,
      });

    if (driverProfileError) throw driverProfileError;

  } catch (error) {
    console.error('Error creating driver:', error);
    throw new Error('Failed to create driver');
  }
}

export async function updateUserToAdmin(email: string): Promise<void> {
  const { data: userData, error: authError } = await supabaseAdmin.auth.getUser();
  
  if (authError) {
    throw new Error('Authentication error');
  }

  if (!userData?.user) {
    throw new Error('No authenticated user');
  }

  try {
    // First, get the user's profile
    const { data: userProfile, error: userError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (userError) {
      console.error('Error finding user:', userError);
      throw new Error('User not found');
    }

    if (!userProfile) {
      throw new Error('User profile not found');
    }

    // Update the user's role to admin in user_profiles
    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({ 
        role: 'admin',
        updated_at: new Date().toISOString()
      })
      .eq('id', userProfile.id);

    if (updateError) {
      console.error('Error updating user role:', updateError);
      throw new Error('Failed to update user role');
    }

    // Also update the user's metadata in auth.users
    const { error: metadataError } = await supabaseAdmin.auth.updateUser({
      data: { role: 'admin' }
    });

    if (metadataError) {
      console.error('Error updating user metadata:', metadataError);
      throw new Error('Failed to update user metadata');
    }

    return;
  } catch (error) {
    console.error('Error in updateUserToAdmin:', error);
    throw error;
  }
} 