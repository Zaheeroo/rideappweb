'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TripDetailsModal } from '@/components/dashboard';
import { updateTripStatus, getDriverTrips } from '@/lib/actions';
import { toast } from 'sonner';
import type { Trip } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function DriverTrips() {
  const { data: session } = useSession();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isStatusChangeModalOpen, setIsStatusChangeModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [pendingAction, setPendingAction] = useState<{
    tripId: string;
    newStatus: Trip['status'];
  } | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      fetchTrips();
    }
  }, [session?.user?.id]);

  const fetchTrips = async () => {
    try {
      const data = await getDriverTrips(session?.user?.id as string);
      setTrips(data);
    } catch (error) {
      toast.error('Failed to fetch trips');
      console.error('Error fetching trips:', error);
    }
  };

  const handleStatusChange = async (tripId: string, newStatus: Trip['status']) => {
    if (newStatus === 'completed') {
      setPendingAction({ tripId, newStatus });
      setIsCompleteModalOpen(true);
      return;
    }

    try {
      setIsLoading(true);
      await updateTripStatus(tripId, newStatus);
      toast.success(`Trip status updated to ${newStatus}`);
      fetchTrips();
    } catch (error) {
      toast.error('Failed to update trip status');
      console.error('Error updating trip status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteConfirm = async () => {
    if (!pendingAction) return;
    
    try {
      setIsLoading(true);
      await updateTripStatus(pendingAction.tripId, 'completed');
      toast.success('Trip marked as completed');
      fetchTrips();
      setIsCompleteModalOpen(false);
    } catch (error) {
      toast.error('Failed to complete trip');
      console.error('Error completing trip:', error);
    } finally {
      setIsLoading(false);
      setPendingAction(null);
    }
  };

  const handleCancelConfirm = async () => {
    if (!pendingAction || !cancellationReason.trim()) return;
    
    try {
      setIsLoading(true);
      await updateTripStatus(pendingAction.tripId, 'cancelled');
      toast.success('Trip cancelled successfully');
      fetchTrips();
      setIsCancelModalOpen(false);
      setCancellationReason('');
    } catch (error) {
      toast.error('Failed to cancel trip');
      console.error('Error cancelling trip:', error);
    } finally {
      setIsLoading(false);
      setPendingAction(null);
    }
  };

  const getTripTypeDisplay = (type: Trip['trip_type']) => {
    switch (type) {
      case 'airport_pickup':
        return 'Airport Pickup';
      case 'airport_dropoff':
        return 'Airport Dropoff';
      case 'city_tour':
        return 'City Tour';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Trips</h2>
      </div>

      <div className="grid gap-4">
        {trips.map((trip) => (
          <Card key={trip.id} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  {getTripTypeDisplay(trip.trip_type)}
                </h3>
                <p className="text-gray-600">
                  {new Date(trip.pickup_time).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">
                  From: {trip.pickup_location}
                </p>
                <p className="text-sm text-gray-500">
                  To: {trip.dropoff_location}
                </p>
                {trip.flight_number && (
                  <p className="text-sm text-gray-500">
                    Flight: {trip.flight_number}
                  </p>
                )}
                {trip.hours && (
                  <p className="text-sm text-gray-500">
                    Duration: {trip.hours} hours
                  </p>
                )}
                <p className="mt-2 font-semibold">
                  ${trip.cost}
                </p>
              </div>

              <div className="flex flex-col space-y-4">
                <div className="flex flex-col items-end gap-2">
                  {trip.status !== 'completed' && trip.status !== 'cancelled' ? (
                    <Select
                      value={trip.status}
                      onValueChange={(value) => handleStatusChange(trip.id, value as Trip['status'])}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue>
                          <span className={`inline-block px-2 py-1 rounded-full text-sm font-medium
                            ${trip.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                              trip.status === 'en-route' ? 'bg-yellow-100 text-yellow-800' :
                              trip.status === 'completed' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'}`}
                          >
                            {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">
                          <span className="inline-block px-2 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            Scheduled
                          </span>
                        </SelectItem>
                        <SelectItem value="en-route">
                          <span className="inline-block px-2 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                            En Route
                          </span>
                        </SelectItem>
                        <SelectItem value="completed">
                          <span className="inline-block px-2 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            Completed
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium
                      ${trip.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                    >
                      {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                    </span>
                  )}
                </div>

                <div className="flex flex-col space-y-2">
                  {trip.status === 'scheduled' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setPendingAction({ tripId: trip.id, newStatus: 'cancelled' });
                        setIsCancelModalOpen(true);
                      }}
                      disabled={isLoading}
                    >
                      Cancel Trip
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTrip(trip);
                      setIsModalOpen(true);
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Cancel Trip Modal */}
      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Trip</DialogTitle>
            <DialogDescription>
              Please provide a reason for cancelling this trip. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="cancellation-reason">Cancellation Reason</Label>
            <Textarea
              id="cancellation-reason"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="Please explain why you need to cancel this trip..."
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCancelModalOpen(false);
                setPendingAction(null);
                setCancellationReason('');
              }}
              disabled={isLoading}
            >
              Keep Trip
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelConfirm}
              disabled={isLoading || !cancellationReason.trim()}
            >
              {isLoading ? 'Cancelling...' : 'Cancel Trip'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Trip Modal */}
      <Dialog open={isCompleteModalOpen} onOpenChange={setIsCompleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Trip</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this trip as completed? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCompleteModalOpen(false);
                setPendingAction(null);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCompleteConfirm}
              disabled={isLoading}
            >
              {isLoading ? 'Completing...' : 'Complete Trip'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TripDetailsModal
        trip={selectedTrip}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTrip(null);
        }}
      />
    </div>
  );
} 