'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { Bell, Globe, Menu, User } from 'lucide-react';
import { useState } from 'react';

export default function DashboardHeader() {
  const { data: session } = useSession();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="text-xl font-bold text-blue-600">
            RideApp
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/dashboard/book" className="text-gray-800 hover:text-blue-600">
              Book a Trip
            </Link>
            <Link href="/dashboard/trips" className="text-gray-800 hover:text-blue-600">
              My Trips
            </Link>
            <Link href="/dashboard/services" className="text-gray-800 hover:text-blue-600">
              Services
            </Link>
          </nav>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Language Switcher */}
            <button className="p-2 text-gray-800 hover:text-blue-600">
              <Globe className="w-5 h-5" />
            </button>

            {/* Notifications */}
            <button className="p-2 text-gray-800 hover:text-blue-600 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                3
              </span>
            </button>

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 text-gray-800 hover:text-blue-600"
              >
                <User className="w-5 h-5" />
                <span className="hidden md:inline">{session?.user?.name}</span>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <Link
                    href="/dashboard/profile"
                    className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                  >
                    Edit Profile
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-gray-800 hover:text-blue-600"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden py-4">
            <nav className="flex flex-col space-y-4">
              <Link href="/dashboard/book" className="text-gray-800 hover:text-blue-600">
                Book a Trip
              </Link>
              <Link href="/dashboard/trips" className="text-gray-800 hover:text-blue-600">
                My Trips
              </Link>
              <Link href="/dashboard/services" className="text-gray-800 hover:text-blue-600">
                Services
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
} 