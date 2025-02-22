-- Create enums for our system
create type trip_type as enum ('airport', 'point-to-point', 'hourly');
create type trip_status as enum ('scheduled', 'en-route', 'completed', 'cancelled');
create type user_role as enum ('customer', 'driver', 'admin');

-- Create user profiles table
create table user_profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  role user_role default 'customer',
  phone_number text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create driver profiles table (extends user_profiles for drivers)
create table driver_profiles (
  user_id uuid references user_profiles(id) on delete cascade primary key,
  license_number text not null,
  vehicle_make text not null,
  vehicle_model text not null,
  vehicle_year integer not null,
  vehicle_color text not null,
  vehicle_plate text not null,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create driver tags table
create table driver_tags (
  id uuid default gen_random_uuid() primary key,
  driver_id uuid references user_profiles(id) on delete cascade,
  tag text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(driver_id, tag)
);

-- Create trips table
create table trips (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references user_profiles(id) on delete cascade,
  driver_id uuid references user_profiles(id) on delete set null,
  trip_type trip_type not null,
  status trip_status default 'scheduled',
  pickup_time timestamp with time zone not null,
  pickup_location text not null,
  dropoff_location text,
  flight_number text,
  hours integer,
  cost decimal(10,2),
  rating integer check (rating >= 1 and rating <= 5),
  reviewed boolean default false,
  cancellation_reason text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table user_profiles enable row level security;
alter table driver_profiles enable row level security;
alter table trips enable row level security;

-- Policies for user_profiles
create policy "Users can view all profiles"
  on user_profiles for select
  using (true);

create policy "Users can update own profile"
  on user_profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on user_profiles for insert
  with check (auth.uid() = id);

-- Policies for driver_profiles
create policy "Anyone can view driver profiles"
  on driver_profiles for select
  using (true);

create policy "Drivers can update own profile"
  on driver_profiles for update
  using (auth.uid() = user_id);

create policy "Drivers can insert own profile"
  on driver_profiles for insert
  with check (auth.uid() = user_id);

-- Policies for trips
create policy "Users can view own trips"
  on trips for select
  using (auth.uid() = user_id or auth.uid() = driver_id);

create policy "Users can insert own trips"
  on trips for insert
  with check (auth.uid() = user_id);

create policy "Users can update own trips"
  on trips for update
  using (auth.uid() = user_id or auth.uid() = driver_id);

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers
create trigger set_timestamp before update on user_profiles
  for each row execute function update_updated_at_column();

create trigger set_timestamp before update on driver_profiles
  for each row execute function update_updated_at_column();

create trigger set_timestamp before update on trips
  for each row execute function update_updated_at_column(); 