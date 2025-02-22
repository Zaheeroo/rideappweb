import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/lib/constants';
import { DriverHeader } from '@/components/driver';
import { DriverStats } from '@/components/driver/driver-stats';
import { DriverTrips } from '@/components/driver/driver-trips';

export default async function DriverDashboard() {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user.role !== UserRole.DRIVER && session.user.role !== UserRole.ADMIN)) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <DriverHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          <DriverStats />
          <DriverTrips />
        </div>
      </main>
    </div>
  );
} 