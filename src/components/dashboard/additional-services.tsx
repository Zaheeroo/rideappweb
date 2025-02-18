'use client';

import React, { type ReactElement } from 'react';
import { Plane, Ship, Building2, Palmtree } from 'lucide-react';
import Link from 'next/link';

type Service = {
  id: string;
  title: string;
  description: string;
  icon: ReactElement;
  link: string;
};

const services: Service[] = [
  {
    id: '1',
    title: 'Airport Transfers',
    description: 'Premium airport pickup and drop-off services',
    icon: <Plane className="w-6 h-6" />,
    link: '/services/airport',
  },
  {
    id: '2',
    title: 'Cruise Port Services',
    description: 'Reliable transportation to and from cruise ports',
    icon: <Ship className="w-6 h-6" />,
    link: '/services/cruise',
  },
  {
    id: '3',
    title: 'Corporate Travel',
    description: 'Business travel solutions for professionals',
    icon: <Building2 className="w-6 h-6" />,
    link: '/services/corporate',
  },
  {
    id: '4',
    title: 'Tours & Excursions',
    description: 'Guided tours and local experiences',
    icon: <Palmtree className="w-6 h-6" />,
    link: '/services/tours',
  },
];

export default function AdditionalServices() {
  return (
    <section className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Additional Services</h2>
      
      <div className="grid gap-4">
        {services.map((service) => (
          <Link
            key={service.id}
            href={service.link}
            className="group block p-4 border rounded-lg hover:border-primary transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="text-gray-800 group-hover:text-blue-600 transition-colors">
                {service.icon}
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                  {service.title}
                </h3>
                <p className="text-sm text-gray-800 mt-1">
                  {service.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
} 