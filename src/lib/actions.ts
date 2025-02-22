import { supabase } from '@/lib/supabase';

export async function updateDriverStatus(userId: string, isActive: boolean) {
  const { error } = await supabase
    .from('driver_profiles')
    .update({ is_active: isActive })
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating driver status:', error);
    throw new Error('Failed to update driver status');
  }
}

export async function updateTripStatus(tripId: string, status: string) {
  const { error } = await supabase
    .from('trips')
    .update({ status })
    .eq('id', tripId);

  if (error) {
    console.error('Error updating trip status:', error);
    throw new Error('Failed to update trip status');
  }
}

export async function getDriverTrips(driverId: string) {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('driver_id', driverId)
    .order('pickup_time', { ascending: true });

  if (error) {
    console.error('Error fetching driver trips:', error);
    throw new Error('Failed to fetch driver trips');
  }

  return data;
}

export async function getDriverStats(driverId: string) {
  // Get today's trips count
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: todayTrips, error: todayError } = await supabase
    .from('trips')
    .select('id')
    .eq('driver_id', driverId)
    .eq('status', 'completed')
    .gte('pickup_time', today.toISOString());

  if (todayError) {
    console.error('Error fetching today trips:', todayError);
    throw new Error('Failed to fetch today trips');
  }

  // Get average rating
  const { data: ratings, error: ratingsError } = await supabase
    .from('trips')
    .select('rating')
    .eq('driver_id', driverId)
    .not('rating', 'is', null);

  if (ratingsError) {
    console.error('Error fetching ratings:', ratingsError);
    throw new Error('Failed to fetch ratings');
  }

  const averageRating = ratings.length > 0
    ? ratings.reduce((acc, trip) => acc + (trip.rating || 0), 0) / ratings.length
    : 0;

  return {
    todayTrips: todayTrips.length,
    averageRating: Number(averageRating.toFixed(1)),
  };
} 