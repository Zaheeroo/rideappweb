'use client';

import { Car, Calendar, MapPin, User } from 'lucide-react';
import { useState } from 'react';

// This would come from your API
type Trip = {
  id: string;
  pickupTime: string;
  destination: string;
  pickupLocation: string;
  driverName: string;
  vehicleInfo: string;
  status: 'scheduled' | 'en-route' | 'completed' | 'cancelled';
};

const mockTrips: Trip[] = [
  {
    id: '1',
    pickupTime: '2024-02-20T14:30:00',
    destination: 'Miami International Airport',
    pickupLocation: '123 Ocean Drive, Miami Beach',
    driverName: 'John Smith',
    vehicleInfo: 'Black Tesla Model Y - ABC123',
    status: 'scheduled',
  },
  {
    id: '2',
    pickupTime: '2024-02-22T09:00:00',
    destination: 'Port of Miami',
    pickupLocation: '456 Collins Ave, Miami Beach',
    driverName: 'Maria Rodriguez',
    vehicleInfo: 'White Mercedes S-Class - XYZ789',
    status: 'scheduled',
  },
];

export default function UpcomingTrips() {
  const [trips] = useState<Trip[]>(mockTrips);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  };

  return (
    <section className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Upcoming Trips</h2>
      
      {trips.length === 0 ? (
        <p className="text-gray-800 text-center py-8">
          No upcoming trips scheduled. Ready to plan your next journey?
        </p>
      ) : (
        <div className="space-y-6">
          {trips.map((trip) => (
            <div
              key={trip.id}
              className="border rounded-lg p-4 hover:border-primary transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-800">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(trip.pickupTime)}</span>
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

                  <div className="flex items-center gap-2 text-gray-800">
                    <Car className="w-4 h-4" />
                    <span>{trip.vehicleInfo}</span>
                  </div>
                </div>

                <div className="flex md:flex-col gap-3 md:min-w-[120px]">
                  <button
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    onClick={() => {/* Handle view details */}}
                  >
                    View Details
                  </button>
                  <button
                    className="flex-1 px-4 py-2 border border-red-500 text-red-600 rounded-md hover:bg-red-50 transition-colors"
                    onClick={() => {/* Handle cancel trip */}}
                  >
                    Cancel
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