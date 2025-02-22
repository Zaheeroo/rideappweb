'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button as MovingButton } from "@/components/ui/moving-border";
import {
  DashboardHeader,
  UpcomingTrips,
  PastTrips,
  AdditionalServices,
  ChatWidget
} from '@/components/dashboard';
import { User, Car } from 'lucide-react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-8 mb-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Welcome back, {session.user?.name?.split(' ')[0]}!
            </h1>
            <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
              Ready for your next journey? Book a ride with our professional drivers and experience comfort and safety.
            </p>
            <div className="max-w-sm mx-auto">
              <MovingButton
                onClick={() => router.push('/dashboard/book')}
                className="bg-white text-blue-600 hover:bg-gray-50 w-full text-lg font-semibold shadow-lg"
                containerClassName="w-full"
                duration={2000}
                borderClassName="h-[10px] w-[10px] bg-[radial-gradient(circle_at_center,white_30%,transparent_70%)] opacity-90"
              >
                Book a Trip
              </MovingButton>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Upcoming Trips */}
          <div className="lg:col-span-2 space-y-8">
            <UpcomingTrips />
            <PastTrips />
          </div>

          {/* Right Column - Additional Services & Chat */}
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button 
                  onClick={() => router.push('/dashboard/profile')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <User className="w-5 h-5 text-gray-500" />
                  <div>
                    <div className="font-medium">Edit Profile</div>
                    <div className="text-sm text-gray-500">Update your personal information</div>
                  </div>
                </button>
                <button 
                  onClick={() => router.push('/dashboard/services')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Car className="w-5 h-5 text-gray-500" />
                  <div>
                    <div className="font-medium">Our Services</div>
                    <div className="text-sm text-gray-500">View available transportation options</div>
                  </div>
                </button>
              </div>
            </div>
            <AdditionalServices />
            <ChatWidget />
          </div>
        </div>
      </main>
    </div>
  );
} 