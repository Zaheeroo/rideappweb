'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, Plane, ArrowLeft } from 'lucide-react';
import { createTrip, type TripType } from '@/lib/supabase/trips';
import { toast } from 'sonner';

export default function BookTripPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [tripType, setTripType] = useState<TripType>('point-to-point');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [hours, setHours] = useState('2');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate date is not in the past
      const pickupDateTime = new Date(`${date}T${time}`);
      if (pickupDateTime < new Date()) {
        toast.error('Pickup time cannot be in the past');
        return;
      }

      const trip = await createTrip({
        trip_type: tripType,
        pickup_time: pickupDateTime.toISOString(),
        pickup_location: pickupLocation,
        dropoff_location: tripType !== 'hourly' ? dropoffLocation : undefined,
        flight_number: tripType === 'airport' ? flightNumber : undefined,
        hours: tripType === 'hourly' ? parseInt(hours) : undefined,
      });

      toast.success('Trip booked successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error booking trip:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to book trip. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>

          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">Book a Trip</h1>
              <p className="text-gray-700">
                Fill out the form below to schedule your next ride
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Trip Type Selection */}
              <div className="grid grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setTripType('point-to-point')}
                  className={`p-4 text-center rounded-lg border ${
                    tripType === 'point-to-point'
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-gray-300 text-gray-800 hover:border-blue-600/50'
                  }`}
                >
                  <MapPin className="w-6 h-6 mx-auto mb-2" />
                  <span className="block font-medium">Point to Point</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTripType('airport')}
                  className={`p-4 text-center rounded-lg border ${
                    tripType === 'airport'
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-gray-300 text-gray-800 hover:border-blue-600/50'
                  }`}
                >
                  <Plane className="w-6 h-6 mx-auto mb-2" />
                  <span className="block font-medium">Airport Transfer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTripType('hourly')}
                  className={`p-4 text-center rounded-lg border ${
                    tripType === 'hourly'
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-gray-300 text-gray-800 hover:border-blue-600/50'
                  }`}
                >
                  <Clock className="w-6 h-6 mx-auto mb-2" />
                  <span className="block font-medium">Hourly Service</span>
                </button>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600/50 text-gray-800 placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600/50 text-gray-800 placeholder-gray-500"
                  />
                </div>
              </div>

              {/* Pickup Location */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Pickup Location
                </label>
                <input
                  type="text"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  placeholder="Enter pickup address"
                  required
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600/50 text-gray-800 placeholder-gray-500"
                />
              </div>

              {/* Dropoff Location or Hours */}
              {tripType !== 'hourly' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Dropoff Location
                  </label>
                  <input
                    type="text"
                    value={dropoffLocation}
                    onChange={(e) => setDropoffLocation(e.target.value)}
                    placeholder="Enter destination address"
                    required
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600/50 text-gray-800 placeholder-gray-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Number of Hours
                  </label>
                  <select
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600/50 text-gray-800"
                  >
                    {[2, 3, 4, 5, 6, 7, 8].map((h) => (
                      <option key={h} value={h} className="text-gray-800">
                        {h} hours
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Flight Number (for airport transfers) */}
              {tripType === 'airport' && (
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Flight Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={flightNumber}
                    onChange={(e) => setFlightNumber(e.target.value)}
                    placeholder="Enter flight number"
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600/50 text-gray-800 placeholder-gray-500"
                  />
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Booking...' : 'Book Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 