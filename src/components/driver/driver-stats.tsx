'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { updateDriverStatus, getDriverStats } from '@/lib/actions';
import { toast } from 'sonner';

type DriverStats = {
  todayTrips: number;
  averageRating: number;
};

export function DriverStats() {
  const { data: session } = useSession();
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<DriverStats>({
    todayTrips: 0,
    averageRating: 0,
  });

  useEffect(() => {
    if (session?.user?.id) {
      fetchStats();
    }
  }, [session?.user?.id]);

  const fetchStats = async () => {
    try {
      const data = await getDriverStats(session?.user?.id as string);
      setStats(data);
    } catch (error) {
      toast.error('Failed to fetch stats');
      console.error('Error fetching stats:', error);
    }
  };

  const handleStatusChange = async (checked: boolean) => {
    try {
      setIsLoading(true);
      await updateDriverStatus(session?.user?.id as string, checked);
      setIsActive(checked);
      toast.success(`Status updated to ${checked ? 'Active' : 'Inactive'}`);
    } catch (error) {
      toast.error('Failed to update status');
      console.error('Error updating status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-2">Status</h3>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">
            {isActive ? 'Active' : 'Inactive'}
          </span>
          <Switch
            checked={isActive}
            onCheckedChange={handleStatusChange}
            disabled={isLoading}
          />
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-2">Today's Trips</h3>
        <div className="text-3xl font-bold">{stats.todayTrips}</div>
        <p className="text-gray-600 text-sm">Completed trips today</p>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-2">Rating</h3>
        <div className="text-3xl font-bold">{stats.averageRating}</div>
        <p className="text-gray-600 text-sm">Average rating</p>
      </Card>
    </div>
  );
} 