'use client';

import { useEffect, useState } from 'react';
import { 
  getTrips,
  assignDriverToTrip,
  removeDriverFromTrip,
  updateTripStatus,
  getDriverStats,
  type DetailedTrip,
  type DriverStats,
  type TripStatus,
  type TripType
} from '@/lib/supabase/admin-operations';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { PlusCircle, MinusCircle, Car, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TripsManagement() {
  const [trips, setTrips] = useState<DetailedTrip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [availableDrivers, setAvailableDrivers] = useState<DriverStats[]>([]);
  const [isAssignDriverOpen, setIsAssignDriverOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<DetailedTrip | null>(null);
  const [isRemoveDriverDialogOpen, setIsRemoveDriverDialogOpen] = useState(false);

  useEffect(() => {
    loadTrips();
    loadDrivers();
  }, []);

  const loadTrips = async () => {
    try {
      const tripsData = await getTrips();
      setTrips(tripsData.map(trip => ({
        ...trip,
        status: trip.status as TripStatus
      })));
    } catch (error) {
      console.error('Error loading trips:', error);
      toast.error('Failed to load trips');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDrivers = async () => {
    try {
      const driversData = await getDriverStats();
      setAvailableDrivers(driversData.filter((driver: DriverStats) => driver.is_active));
    } catch (error) {
      console.error('Error loading drivers:', error);
      toast.error('Failed to load drivers');
    }
  };

  const handleStatusChange = async (tripId: string, newStatus: TripStatus) => {
    try {
      await updateTripStatus(tripId, newStatus);
      setTrips(trips.map(trip =>
        trip.id === tripId ? { ...trip, status: newStatus } : trip
      ));
      toast.success('Trip status updated successfully');
    } catch (error) {
      console.error('Error updating trip status:', error);
      toast.error('Failed to update trip status');
    }
  };

  const handleAssignDriver = async (tripId: string, driverId: string) => {
    try {
      await assignDriverToTrip(tripId, driverId);
      const driver = availableDrivers.find(d => d.id === driverId);
      if (driver) {
        setTrips(trips.map(trip =>
          trip.id === tripId ? {
            ...trip,
            driver_id: driver.id,
            driver: {
              id: driver.id,
              full_name: driver.full_name,
              email: driver.email,
              phone_number: driver.phone_number,
              avatar_url: driver.avatar_url,
              driver_profile: {
                user_id: driver.id,
                license_number: driver.license_number,
                vehicle_make: driver.vehicle_make,
                vehicle_model: driver.vehicle_model,
                vehicle_year: driver.vehicle_year,
                vehicle_color: driver.vehicle_color,
                vehicle_plate: driver.vehicle_plate,
                is_active: true,
                email: driver.email,
                avatar_url: driver.avatar_url,
              }
            }
          } : trip
        ));
      }
      setIsAssignDriverOpen(false);
      toast.success('Driver assigned successfully');
    } catch (error) {
      console.error('Error assigning driver:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to assign driver');
    }
  };

  const handleRemoveDriver = async (tripId: string) => {
    try {
      await removeDriverFromTrip(tripId);
      setTrips(trips.map(trip =>
        trip.id === tripId ? { ...trip, driver: undefined, status: 'scheduled' } : trip
      ));
      toast.success('Driver removed successfully');
      setIsRemoveDriverDialogOpen(false);
    } catch (error) {
      console.error('Error removing driver:', error);
      toast.error('Failed to remove driver');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTripTypeLabel = (type: TripType) => {
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

  const getStatusColor = (status: TripStatus) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'en-route':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTripTypeColor = (type: TripType) => {
    switch (type) {
      case 'airport_pickup':
        return 'bg-blue-50 text-blue-700';
      case 'airport_dropoff':
        return 'bg-purple-50 text-purple-700';
      case 'city_tour':
        return 'bg-amber-50 text-amber-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading trips data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Trips Management</h2>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/75">
              <TableHead className="font-semibold text-gray-700">Customer</TableHead>
              <TableHead className="font-semibold text-gray-700">Trip Type</TableHead>
              <TableHead className="font-semibold text-gray-700">Driver</TableHead>
              <TableHead className="font-semibold text-gray-700">Vehicle</TableHead>
              <TableHead className="font-semibold text-gray-700">Pickup</TableHead>
              <TableHead className="font-semibold text-gray-700">Dropoff</TableHead>
              <TableHead className="font-semibold text-gray-700 text-right">Cost</TableHead>
              <TableHead className="font-semibold text-gray-700 text-center">Status</TableHead>
              <TableHead className="font-semibold text-gray-700 text-center">Rating</TableHead>
              <TableHead className="font-semibold text-gray-700 text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trips.map((trip) => (
              <TableRow key={trip.id} className="hover:bg-gray-50/75 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="border border-gray-200">
                      <AvatarFallback className="bg-blue-100 text-blue-800">
                        {trip.user_id.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">{trip.user_id}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                    getTripTypeColor(trip.trip_type)
                  )}>
                    {getTripTypeLabel(trip.trip_type)}
                  </span>
                </TableCell>
                <TableCell>
                  {trip.driver ? (
                    <div className="flex items-center gap-3">
                      <Avatar className="border border-gray-200">
                        <AvatarImage src={trip.driver.avatar_url} />
                        <AvatarFallback className="bg-green-100 text-green-800">
                          {trip.driver.full_name.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900">{trip.driver.full_name}</p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500 italic">Unassigned</span>
                  )}
                </TableCell>
                <TableCell>
                  {trip.driver ? (
                    <div className="flex items-center gap-2 text-sm">
                      <Car className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-gray-900">{trip.driver.driver_profile.vehicle_make} {trip.driver.driver_profile.vehicle_model}</p>
                        <p className="text-gray-500 text-xs">{trip.driver.driver_profile.vehicle_plate}</p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500 italic">No vehicle info</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{trip.pickup_location}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(trip.pickup_time)}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{trip.dropoff_location || 'N/A'}</p>
                      <p className="text-xs text-gray-500">
                        {trip.dropoff_time ? formatDate(trip.dropoff_time) : 'Not set'}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-medium text-gray-900">{formatCurrency(trip.cost)}</span>
                </TableCell>
                <TableCell className="text-center">
                  <Select
                    value={trip.status}
                    onValueChange={(value: TripStatus) => handleStatusChange(trip.id, value)}
                  >
                    <SelectTrigger className={cn(
                      "w-[130px] h-8 text-xs font-medium border-0 ring-1 ring-inset ring-transparent",
                      "hover:ring-gray-200 transition-all justify-center",
                      getStatusColor(trip.status)
                    )}>
                      <SelectValue>
                        {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled" className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        Scheduled
                      </SelectItem>
                      <SelectItem value="en-route" className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        En Route
                      </SelectItem>
                      <SelectItem value="completed" className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        Completed
                      </SelectItem>
                      <SelectItem value="cancelled" className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        Cancelled
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-medium text-gray-900">
                    {trip.rating ? (
                      <span className="inline-flex items-center gap-1">
                        {trip.rating.toFixed(1)}
                        <span className="text-yellow-400">★</span>
                      </span>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2 pr-4">
                    {!trip.driver ? (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setSelectedTrip(trip);
                          setIsAssignDriverOpen(true);
                        }}
                        title="Assign Driver"
                        className="h-9 w-9 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setSelectedTrip(trip);
                          setIsRemoveDriverDialogOpen(true);
                        }}
                        className="h-9 w-9 hover:bg-red-50 text-red-600 hover:text-red-700 hover:border-red-200 transition-colors"
                        title="Remove Driver"
                      >
                        <MinusCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isAssignDriverOpen} onOpenChange={setIsAssignDriverOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">Assign Driver to Trip</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            {availableDrivers.length > 0 ? (
              <Select onValueChange={(value) => {
                if (selectedTrip) {
                  handleAssignDriver(selectedTrip.id, value);
                }
              }}>
                <SelectTrigger className="w-full h-10 bg-white border-gray-200">
                  <SelectValue placeholder="Select a driver" />
                </SelectTrigger>
                <SelectContent>
                  {availableDrivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id} className="py-2.5">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border border-gray-200">
                          <AvatarImage src={driver.avatar_url} />
                          <AvatarFallback className="bg-green-100 text-green-800 text-sm">
                            {driver.full_name.split(' ').map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">{driver.full_name}</span>
                          <span className="text-sm text-gray-500">
                            {driver.vehicle_make} {driver.vehicle_model} • {driver.vehicle_plate}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">No active drivers available</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        isOpen={isRemoveDriverDialogOpen}
        onClose={() => setIsRemoveDriverDialogOpen(false)}
        onConfirm={() => selectedTrip && handleRemoveDriver(selectedTrip.id)}
        title="Remove Driver from Trip"
        description={
          selectedTrip?.driver
            ? `Are you sure you want to remove ${selectedTrip.driver.full_name} from this trip? The trip will be reset to 'scheduled' status and will need to be reassigned to another driver.`
            : ''
        }
        confirmText="Remove Driver"
        cancelText="Cancel"
      />
    </div>
  );
} 