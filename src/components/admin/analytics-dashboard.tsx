'use client';

import { useEffect, useState } from 'react';
import { MapPin, TrendingUp, Users, Car, DollarSign, Calendar } from 'lucide-react';
import { getAdminStats, getPopularDestinations, type AdminStats, type PopularDestination } from '@/lib/supabase/admin-operations';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function AnalyticsDashboard() {
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [popularDestinations, setPopularDestinations] = useState<PopularDestination[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [timeframe]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsData, destinationsData] = await Promise.all([
        getAdminStats(timeframe),
        getPopularDestinations(timeframe === 'day' ? 'week' : timeframe),
      ]);

      setStats(statsData);
      setPopularDestinations(destinationsData);
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
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
        <div className="text-lg text-gray-600">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Analytics Overview</h2>
        <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm p-1">
          <Calendar className="w-4 h-4 text-gray-500" />
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as typeof timeframe)}
            className="text-sm font-medium text-gray-700 bg-transparent border-none focus:outline-none focus:ring-0 cursor-pointer"
          >
            <option value="day">Last 24 Hours</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last 12 Months</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm border border-green-100/50 p-6 transition-transform hover:scale-[1.02]">
            <div className="flex items-center gap-4">
              <div className="bg-green-500/10 rounded-lg p-2">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.totalRevenue)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-100/50 p-6 transition-transform hover:scale-[1.02]">
            <div className="flex items-center gap-4">
              <div className="bg-blue-500/10 rounded-lg p-2">
                <Car className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-600">Total Trips</p>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalTrips}
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-600">{stats.completedTrips} completed</span>
                    <span className="text-gray-300">•</span>
                    <span className="text-red-600">{stats.cancelledTrips} cancelled</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 rounded-xl shadow-sm border border-purple-100/50 p-6 transition-transform hover:scale-[1.02]">
            <div className="flex items-center gap-4">
              <div className="bg-purple-500/10 rounded-lg p-2">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-600">Active Drivers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.activeDrivers}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-sm border border-amber-100/50 p-6 transition-transform hover:scale-[1.02]">
            <div className="flex items-center gap-4">
              <div className="bg-amber-500/10 rounded-lg p-2">
                <TrendingUp className="w-8 h-8 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-600">Average Rating</p>
                <div className="flex items-center gap-1">
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.averageRating.toFixed(1)}
                  </p>
                  <span className="text-2xl text-amber-400">★</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popular Destinations */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">
            Popular Destinations
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {popularDestinations.map((destination, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  index === 0 ? "bg-amber-100 text-amber-600" :
                  index === 1 ? "bg-gray-100 text-gray-600" :
                  index === 2 ? "bg-orange-100 text-orange-600" :
                  "bg-blue-50 text-blue-600"
                )}>
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{destination.location}</p>
                  <p className="text-sm text-gray-500">{destination.count} trips</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">
                  {formatCurrency(destination.totalRevenue)}
                </p>
                <p className="text-sm text-gray-500">
                  {((destination.totalRevenue / stats.totalRevenue) * 100).toFixed(1)}% of revenue
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 