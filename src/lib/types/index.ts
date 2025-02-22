export type TripType = 'airport_pickup' | 'airport_dropoff' | 'city_tour';
export type TripStatus = 'scheduled' | 'en-route' | 'completed' | 'cancelled';

export type Trip = {
  id: string;
  user_id: string;
  driver_id?: string;
  driver?: {
    full_name: string;
    phone_number?: string;
    email?: string;
    avatar_url?: string;
    driver_profile?: DriverProfile;
  };
  trip_type: TripType;
  status: TripStatus;
  pickup_time: string;
  pickup_location: string;
  dropoff_location?: string;
  flight_number?: string;
  hours?: number;
  cost?: number;
  rating?: number;
  reviewed: boolean;
  created_at: string;
  updated_at: string;
};

export type DriverProfile = {
  user_id: string;
  license_number: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_color: string;
  vehicle_plate: string;
  is_active?: boolean;
  email?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
};

export type UserProfile = {
  id: string;
  full_name?: string;
  role?: string;
  phone_number?: string;
  email?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}; 