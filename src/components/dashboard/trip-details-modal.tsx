'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, Clock, MapPin, Plane, User, Phone, Car, Mail } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import type { Trip } from '@/lib/types';

interface TripDetailsModalProps {
  trip: Trip | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function TripDetailsModal({ trip, isOpen, onClose }: TripDetailsModalProps) {
  if (!trip) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Trip Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">
              {trip.trip_type === 'airport_pickup' ? 'Airport Pickup' :
               trip.trip_type === 'airport_dropoff' ? 'Airport Dropoff' : 'City Tour'}
            </h3>
            <p className="text-gray-600">
              {new Date(trip.pickup_time).toLocaleString()}
            </p>
          </div>

          <div className="space-y-2">
            <div>
              <span className="font-medium">From:</span>
              <p className="text-gray-600">{trip.pickup_location}</p>
            </div>
            <div>
              <span className="font-medium">To:</span>
              <p className="text-gray-600">{trip.dropoff_location}</p>
            </div>
            {trip.flight_number && (
              <div>
                <span className="font-medium">Flight Number:</span>
                <p className="text-gray-600">{trip.flight_number}</p>
              </div>
            )}
            {trip.hours && (
              <div>
                <span className="font-medium">Duration:</span>
                <p className="text-gray-600">{trip.hours} hours</p>
              </div>
            )}
            <div>
              <span className="font-medium">Cost:</span>
              <p className="text-gray-600">${trip.cost}</p>
            </div>
            <div>
              <span className="font-medium">Status:</span>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ml-2
                ${trip.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                  trip.status === 'en-route' ? 'bg-yellow-100 text-yellow-800' :
                  trip.status === 'completed' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'}`}
              >
                {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 