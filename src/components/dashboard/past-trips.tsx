'use client';

import { Calendar, MapPin, Star, User } from 'lucide-react';
import { useState } from 'react';

type PastTrip = {
  id: string;
  date: string;
  destination: string;
  pickupLocation: string;
  driverName: string;
  cost: number;
  rating?: number;
  reviewed: boolean;
};

const mockPastTrips: PastTrip[] = [
  {
    id: '1',
    date: '2024-02-15T10:00:00',
    destination: 'Miami International Airport',
    pickupLocation: '789 Ocean Drive, Miami Beach',
    driverName: 'Michael Brown',
    cost: 75.00,
    rating: 5,
    reviewed: true,
  },
  {
    id: '2',
    date: '2024-02-10T15:30:00',
    destination: 'Brickell City Centre',
    pickupLocation: '1000 Collins Ave, Miami Beach',
    driverName: 'Sarah Johnson',
    cost: 45.00,
    reviewed: false,
  },
];

export default function PastTrips() {
  const [trips] = useState<PastTrip[]>(mockPastTrips);
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(0);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  };

  const handleRating = (tripId: string, newRating: number) => {
    setSelectedTrip(tripId);
    setRating(newRating);
    // Here you would typically make an API call to save the rating
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
                    <span>{formatDate(trip.date)}</span>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-800 mt-1" />
                    <div>
                      <p className="text-sm text-gray-800">From:</p>
                      <p className="text-gray-800">{trip.pickupLocation}</p>
                      <p className="text-sm text-gray-800 mt-1">To:</p>
                      <p className="text-gray-800">{trip.destination}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-gray-800">
                    <User className="w-4 h-4" />
                    <span>{trip.driverName}</span>
                  </div>

                  <div className="font-semibold text-gray-800">
                    ${trip.cost.toFixed(2)}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-800">
                      {trip.reviewed ? 'Your Rating:' : 'Rate your trip:'}
                    </p>
                    {renderStars(trip.id, trip.rating)}
                  </div>

                  <button
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    onClick={() => {/* Handle view details */}}
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
} 