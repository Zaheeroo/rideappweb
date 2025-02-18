'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  DashboardHeader,
  UpcomingTrips,
  PastTrips,
  AdditionalServices,
  ChatWidget
} from '@/components/dashboard';
import { WavyBackground } from '@/components/ui/wavy-background';

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
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="relative">
          <WavyBackground className="max-w-4xl mx-auto">
            <div className="relative z-10 text-center py-12">
              <h1 className="text-3xl font-bold mb-4">
                Welcome, {session.user?.name}!
              </h1>
              <button
                onClick={() => router.push('/dashboard/book')}
                className="bg-primary text-white px-8 py-3 rounded-full font-semibold hover:bg-primary/90 transition-colors"
              >
                Book a Trip
              </button>
            </div>
          </WavyBackground>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
          {/* Left Column - Upcoming Trips */}
          <div className="lg:col-span-2">
            <UpcomingTrips />
            <div className="mt-8">
              <PastTrips />
            </div>
          </div>

          {/* Right Column - Additional Services & Chat */}
          <div className="space-y-8">
            <AdditionalServices />
            <ChatWidget />
          </div>
        </div>
      </main>
    </div>
  );
} 