'use client';

import { Car, Calendar, MapPin, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getUpcomingTrips, type Trip } from '@/lib/supabase/trips';
import { toast } from 'sonner';
import TripDetailsModal from './trip-details-modal';
import CancelTripDialog from './cancel-trip-dialog';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function UpcomingTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [cancelTripId, setCancelTripId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getUpcomingTrips();
      setTrips(data);
    } catch (error) {
      console.error('Error loading trips:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to load upcoming trips');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelClick = (tripId: string) => {
    setCancelTripId(tripId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <section className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Upcoming Trips</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Upcoming Trips</h2>
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadTrips}
            className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
          >
            Try again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Upcoming Trips</h2>
        <span className="text-sm font-medium text-gray-500">{trips.length} trips scheduled</span>
      </div>
      
      {trips.length === 0 ? (
        <div className="text-center py-12 px-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 flex items-center justify-center">
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-gray-600 mb-2">No upcoming trips scheduled</p>
          <p className="text-sm text-gray-500 mb-6">Ready to plan your next journey?</p>
          <button
            onClick={() => router.push('/dashboard/book')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Book Now
            <Car className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {trips.map((trip) => (
            <div
              key={trip.id}
              className="border border-gray-200 rounded-xl p-5 hover:border-blue-200 hover:shadow-md transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="font-medium text-gray-900">{formatDate(trip.pickup_time)}</span>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-600">Pickup</p>
                      </div>
                      <p className="text-gray-900">{trip.pickup_location}</p>
                      {trip.dropoff_location && (
                        <>
                          <div className="flex items-center gap-2 mb-1 mt-3">
                            <p className="text-sm font-medium text-gray-600">Dropoff</p>
                          </div>
                          <p className="text-gray-900">{trip.dropoff_location}</p>
                        </>
                      )}
                    </div>
                  </div>

                  {trip.driver && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center overflow-hidden">
                        {trip.driver.avatar_url ? (
                          <Image
                            src={trip.driver.avatar_url}
                            alt={trip.driver.full_name}
                            width={40}
                            height={40}
                            className="object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Driver</p>
                        <p className="text-gray-900">{trip.driver.full_name}</p>
                      </div>
                    </div>
                  )}

                  {trip.trip_type === 'airport' && trip.flight_number && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <span className="font-medium">Flight:</span>
                      <span>{trip.flight_number}</span>
                    </div>
                  )}

                  {trip.trip_type === 'hourly' && trip.hours && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <span className="font-medium">Duration:</span>
                      <span>{trip.hours} hours</span>
                    </div>
                  )}
                </div>

                <div className="flex md:flex-col gap-3 md:min-w-[140px]">
                  <button
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    onClick={() => setSelectedTripId(trip.id)}
                  >
                    View Details
                  </button>
                  <button
                    className="flex-1 px-4 py-2.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
                    onClick={() => handleCancelClick(trip.id)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <TripDetailsModal
        tripId={selectedTripId}
        onClose={() => setSelectedTripId(null)}
      />

      <CancelTripDialog
        tripId={cancelTripId}
        onClose={() => setCancelTripId(null)}
        onCancelled={loadTrips}
      />
    </section>
  );
} 