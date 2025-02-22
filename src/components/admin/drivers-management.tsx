'use client';

import { useEffect, useState } from 'react';
import { 
  getDriverStats, 
  updateDriverStatus, 
  addDriver, 
  updateDriver, 
  removeDriver,
  addDriverTag,
  removeDriverTag,
  type DriverStats 
} from '@/lib/supabase/admin-operations';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { PlusCircle, Pencil, Trash2, Car, Tag, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DriverFormData {
  email: string;
  password: string;
  full_name: string;
  phone_number: string;
  avatar_url?: string;
  license_number: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_color: string;
  vehicle_plate: string;
}

export default function DriversManagement() {
  const [drivers, setDrivers] = useState<DriverStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDriverOpen, setIsAddDriverOpen] = useState(false);
  const [isEditDriverOpen, setIsEditDriverOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<DriverStats | null>(null);
  const [formData, setFormData] = useState<DriverFormData>({
    email: '',
    password: '',
    full_name: '',
    phone_number: '',
    license_number: '',
    vehicle_make: '',
    vehicle_model: '',
    vehicle_year: new Date().getFullYear(),
    vehicle_color: '',
    vehicle_plate: '',
  });
  const [tagInput, setTagInput] = useState('');
  const [selectedDriverForTags, setSelectedDriverForTags] = useState<DriverStats | null>(null);
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      const driversData = await getDriverStats();
      setDrivers(driversData);
    } catch (error) {
      console.error('Error loading drivers:', error);
      toast.error('Failed to load drivers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (driverId: string, newStatus: boolean) => {
    try {
      await updateDriverStatus(driverId, newStatus);
      setDrivers(drivers.map(driver =>
        driver.id === driverId ? { ...driver, is_active: newStatus } : driver
      ));
      toast.success(`Driver status updated successfully`);
    } catch (error) {
      console.error('Error updating driver status:', error);
      toast.error('Failed to update driver status');
    }
  };

  const handleAddDriver = async () => {
    try {
      // Basic validation for required fields
      const requiredFields = [
        'email',
        'password',
        'full_name',
        'phone_number',
        'license_number',
        'vehicle_make',
        'vehicle_model',
        'vehicle_year',
        'vehicle_color',
        'vehicle_plate'
      ];

      const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
      if (missingFields.length > 0) {
        toast.error(`Please fill in all required fields`);
        return;
      }

      // Basic password validation
      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters long');
        return;
      }

      // Basic vehicle year validation
      const currentYear = new Date().getFullYear();
      if (formData.vehicle_year < 1900 || formData.vehicle_year > currentYear + 1) {
        toast.error('Please enter a valid vehicle year between 1900 and ' + (currentYear + 1));
        return;
      }

      await addDriver(formData);
      toast.success('Driver added successfully');
      setIsAddDriverOpen(false);
      loadDrivers();
      
      // Reset form
      setFormData({
        email: '',
        password: '',
        full_name: '',
        phone_number: '',
        license_number: '',
        vehicle_make: '',
        vehicle_model: '',
        vehicle_year: new Date().getFullYear(),
        vehicle_color: '',
        vehicle_plate: '',
      });
    } catch (error) {
      console.error('Error adding driver:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add driver');
    }
  };

  const handleEditDriver = async () => {
    if (!selectedDriver) return;
    try {
      await updateDriver(selectedDriver.id, formData);
      toast.success('Driver updated successfully');
      setIsEditDriverOpen(false);
      loadDrivers();
    } catch (error) {
      console.error('Error updating driver:', error);
      toast.error('Failed to update driver');
    }
  };

  const handleRemoveDriver = async (driverId: string) => {
    try {
      const response = await removeDriver(driverId);
      const data = await response.json();
      
      let message = 'Driver removed successfully';
      if (data.reassignedTrips > 0) {
        message += `. ${data.reassignedTrips} active ${data.reassignedTrips === 1 ? 'trip has' : 'trips have'} been reset to scheduled status.`;
      }
      
      toast.success(message);
      loadDrivers();
      setIsRemoveDialogOpen(false);
    } catch (error) {
      console.error('Error removing driver:', error);
      toast.error('Failed to remove driver');
    }
  };

  const handleAddTag = async () => {
    if (!selectedDriverForTags || !tagInput.trim()) return;
    try {
      await addDriverTag(selectedDriverForTags.id, tagInput);
      setDrivers(drivers.map(driver =>
        driver.id === selectedDriverForTags.id
          ? { ...driver, tags: [...(driver.tags || []), tagInput.toLowerCase().trim()] }
          : driver
      ));
      setTagInput('');
      toast.success('Tag added successfully');
    } catch (error) {
      console.error('Error adding tag:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add tag');
    }
  };

  const handleRemoveTag = async (driverId: string, tag: string) => {
    try {
      await removeDriverTag(driverId, tag);
      setDrivers(drivers.map(driver =>
        driver.id === driverId
          ? { ...driver, tags: (driver.tags || []).filter(t => t !== tag) }
          : driver
      ));
      toast.success('Tag removed successfully');
    } catch (error) {
      console.error('Error removing tag:', error);
      toast.error('Failed to remove tag');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading drivers data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Drivers Management</h2>
        <Dialog open={isAddDriverOpen} onOpenChange={setIsAddDriverOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Add New Driver
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Driver</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="license_number">License Number</Label>
                <Input
                  id="license_number"
                  value={formData.license_number}
                  onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="vehicle_make">Vehicle Make</Label>
                  <Input
                    id="vehicle_make"
                    value={formData.vehicle_make}
                    onChange={(e) => setFormData({ ...formData, vehicle_make: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="vehicle_model">Vehicle Model</Label>
                  <Input
                    id="vehicle_model"
                    value={formData.vehicle_model}
                    onChange={(e) => setFormData({ ...formData, vehicle_model: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="vehicle_year">Year</Label>
                  <Input
                    id="vehicle_year"
                    type="number"
                    value={formData.vehicle_year}
                    onChange={(e) => setFormData({ ...formData, vehicle_year: parseInt(e.target.value) })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="vehicle_color">Color</Label>
                  <Input
                    id="vehicle_color"
                    value={formData.vehicle_color}
                    onChange={(e) => setFormData({ ...formData, vehicle_color: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="vehicle_plate">Plate</Label>
                  <Input
                    id="vehicle_plate"
                    value={formData.vehicle_plate}
                    onChange={(e) => setFormData({ ...formData, vehicle_plate: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => setIsAddDriverOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddDriver}>Add Driver</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold">Driver</TableHead>
              <TableHead className="font-semibold">Contact</TableHead>
              <TableHead className="font-semibold">Vehicle Info</TableHead>
              <TableHead className="font-semibold text-right">Total Trips</TableHead>
              <TableHead className="font-semibold text-right">Completion Rate</TableHead>
              <TableHead className="font-semibold text-right">Total Revenue</TableHead>
              <TableHead className="font-semibold text-center">Rating</TableHead>
              <TableHead className="font-semibold text-center">Status</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
              <TableHead className="font-semibold">Tags</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers.map((driver) => (
              <TableRow key={driver.id} className="hover:bg-gray-50/50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="border border-gray-200">
                      <AvatarImage src={driver.avatar_url} />
                      <AvatarFallback className="bg-blue-100 text-blue-800">
                        {driver.full_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">{driver.full_name}</p>
                      <p className="text-sm text-gray-500">License: {driver.license_number}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-gray-900">{driver.phone_number}</p>
                      <p className="text-gray-500 text-xs">{driver.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm">
                    <Car className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-gray-900">{driver.vehicle_make} {driver.vehicle_model}</p>
                      <p className="text-gray-500 text-xs">{driver.vehicle_color} - {driver.vehicle_plate}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div>
                    <p className="font-medium text-gray-900">{driver.total_trips}</p>
                    <p className="text-sm text-gray-500">
                      {driver.completed_trips} completed
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-medium text-gray-900">
                    {driver.total_trips > 0
                      ? `${((driver.completed_trips / driver.total_trips) * 100).toFixed(1)}%`
                      : 'N/A'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-medium text-gray-900">{formatCurrency(driver.total_revenue)}</span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-medium text-gray-900">
                    {driver.average_rating > 0 ? (
                      <span className="inline-flex items-center gap-1">
                        {driver.average_rating.toFixed(1)}
                        <span className="text-yellow-400">★</span>
                      </span>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={driver.is_active}
                    onCheckedChange={(checked: boolean) => handleStatusChange(driver.id, checked)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setSelectedDriver(driver);
                        setFormData({
                          ...formData,
                          email: driver.email,
                          full_name: driver.full_name,
                          phone_number: driver.phone_number,
                          license_number: driver.license_number,
                          vehicle_make: driver.vehicle_make,
                          vehicle_model: driver.vehicle_model,
                          vehicle_year: driver.vehicle_year,
                          vehicle_color: driver.vehicle_color,
                          vehicle_plate: driver.vehicle_plate,
                        });
                        setIsEditDriverOpen(true);
                      }}
                      title="Edit Driver"
                      className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setSelectedDriver(driver);
                        setIsRemoveDialogOpen(true);
                      }}
                      className="hover:bg-red-50 text-red-600 hover:text-red-700 hover:border-red-200"
                      title="Remove Driver"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    {driver.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(driver.id, tag)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <button
                      onClick={() => {
                        setSelectedDriverForTags(driver);
                        setIsTagDialogOpen(true);
                      }}
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Tag className="h-3 w-3" />
                      Add
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isEditDriverOpen} onOpenChange={setIsEditDriverOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Driver</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-full_name">Full Name</Label>
              <Input
                id="edit-full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone_number">Phone Number</Label>
              <Input
                id="edit-phone_number"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-license_number">License Number</Label>
              <Input
                id="edit-license_number"
                value={formData.license_number}
                onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-vehicle_make">Vehicle Make</Label>
                <Input
                  id="edit-vehicle_make"
                  value={formData.vehicle_make}
                  onChange={(e) => setFormData({ ...formData, vehicle_make: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-vehicle_model">Vehicle Model</Label>
                <Input
                  id="edit-vehicle_model"
                  value={formData.vehicle_model}
                  onChange={(e) => setFormData({ ...formData, vehicle_model: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-vehicle_year">Year</Label>
                <Input
                  id="edit-vehicle_year"
                  type="number"
                  value={formData.vehicle_year}
                  onChange={(e) => setFormData({ ...formData, vehicle_year: parseInt(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-vehicle_color">Color</Label>
                <Input
                  id="edit-vehicle_color"
                  value={formData.vehicle_color}
                  onChange={(e) => setFormData({ ...formData, vehicle_color: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-vehicle_plate">Plate</Label>
                <Input
                  id="edit-vehicle_plate"
                  value={formData.vehicle_plate}
                  onChange={(e) => setFormData({ ...formData, vehicle_plate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setIsEditDriverOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditDriver}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tag to Driver</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button onClick={handleAddTag}>Add</Button>
            </div>
            {selectedDriverForTags?.tags && selectedDriverForTags.tags.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Current Tags:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedDriverForTags.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(selectedDriverForTags.id, tag)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        isOpen={isRemoveDialogOpen}
        onClose={() => setIsRemoveDialogOpen(false)}
        onConfirm={() => selectedDriver && handleRemoveDriver(selectedDriver.id)}
        title="Remove Driver"
        description={
          selectedDriver
            ? `Are you sure you want to remove ${selectedDriver.full_name}? This action cannot be undone and will permanently delete the driver's account and all associated data. Any active trips assigned to this driver will be reset to 'scheduled' status and will need to be reassigned.`
            : ''
        }
        confirmText="Remove Driver"
        cancelText="Cancel"
      />
    </div>
  );
} 