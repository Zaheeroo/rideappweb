'use client';

import { Calendar, MapPin, Star, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getPastTrips, updateTripRating } from '@/lib/supabase/trips';
import type { Trip } from '@/lib/types';
import { toast } from 'sonner';
import TripDetailsModal from './trip-details-modal';
import Image from 'next/image';

export default function PastTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(0);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPastTrips();
      setTrips(data);
    } catch (error) {
      console.error('Error loading trips:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to load past trips');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRating = async (tripId: string, newRating: number) => {
    setSelectedTrip(tripId);
    setRating(newRating);

    try {
      await updateTripRating(tripId, newRating);
      toast.success('Rating submitted successfully');
      loadTrips(); // Reload to get updated data
    } catch (error) {
      console.error('Error updating rating:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to submit rating');
      }
    }
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

  const renderStars = (tripId: string, currentRating: number = 0) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRating(tripId, star)}
            className={`${
              (selectedTrip === tripId ? rating >= star : currentRating >= star)
                ? 'text-yellow-400'
                : 'text-gray-300'
            } hover:text-yellow-400 transition-colors`}
          >
            <Star className="w-5 h-5 fill-current" />
          </button>
        ))}
      </div>
    );
  };

  const getStatusBadgeClasses = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <section className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Past Trips</h2>
        <p className="text-center py-8">Loading trips...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Past Trips</h2>
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadTrips}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Try again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Past Trips</h2>
      
      {trips.length === 0 ? (
        <p className="text-gray-800 text-center py-8">
          No past trips to display.
        </p>
      ) : (
        <div className="space-y-6">
          {trips.map((trip) => (
            <div
              key={trip.id}
              className="border rounded-lg p-4 hover:border-blue-600 transition-colors"
            >
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-800">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(trip.pickup_time)}</span>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-800 mt-1" />
                    <div>
                      <p className="text-sm text-gray-800">From:</p>
                      <p className="text-gray-800">{trip.pickup_location}</p>
                      {trip.dropoff_location && (
                        <>
                          <p className="text-sm text-gray-800 mt-1">To:</p>
                          <p className="text-gray-800">{trip.dropoff_location}</p>
                        </>
                      )}
                    </div>
                  </div>

                  {trip.driver && (
                    <div className="flex items-center gap-2 text-gray-800">
                      {trip.driver.avatar_url ? (
                        <div className="relative w-8 h-8 rounded-full overflow-hidden">
                          <Image
                            src={trip.driver.avatar_url}
                            alt={trip.driver.full_name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                      <span>{trip.driver.full_name}</span>
                    </div>
                  )}

                  {(trip.trip_type === 'airport_pickup' || trip.trip_type === 'airport_dropoff') && trip.flight_number && (
                    <div className="text-gray-800">
                      <span className="font-medium">Flight:</span> {trip.flight_number}
                    </div>
                  )}

                  {trip.trip_type === 'city_tour' && trip.hours && (
                    <div className="text-gray-800">
                      <span className="font-medium">Duration:</span> {trip.hours} hours
                    </div>
                  )}

                  {trip.cost && (
                    <div className="font-semibold text-gray-800">
                      ${trip.cost.toFixed(2)}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="text-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusBadgeClasses(trip.status)}`}>
                      {trip.status}
                    </span>
                  </div>

                  {trip.status === 'completed' && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-800">
                        {trip.reviewed ? 'Your Rating:' : 'Rate your trip:'}
                      </p>
                      {renderStars(trip.id, trip.rating)}
                    </div>
                  )}

                  <button
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    onClick={() => setSelectedTripId(trip.id)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <TripDetailsModal
        trip={trips.find(trip => trip.id === selectedTripId) || null}
        isOpen={!!selectedTripId}
        onClose={() => setSelectedTripId(null)}
      />
    </section>
  );
} 