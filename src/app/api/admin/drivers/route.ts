import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    // Get all drivers with their profiles and average ratings
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select(`
        *,
        driver_profile:driver_profiles(*),
        trips!driver_id(
          rating
        )
      `)
      .eq('role', 'driver');

    if (error) {
      console.error('Error fetching drivers:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate average rating and total trips for each driver
    const driversWithStats = data.map(driver => {
      const trips = driver.trips || [];
      const ratings = trips
        .filter((t: any): t is { rating: number } => t.rating !== null)
        .map((t: { rating: number }) => t.rating);
      const averageRating = ratings.length > 0
        ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
        : 0;

      return {
        ...driver,
        rating: averageRating,
        total_trips: trips.length,
      };
    });

    return NextResponse.json(driversWithStats);
  } catch (error) {
    console.error('Error in drivers API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const driverData = await request.json();

    // Create auth user with admin client
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email: driverData.email.toLowerCase().trim(),
      password: driverData.password,
      email_confirm: true,
      user_metadata: {
        full_name: driverData.full_name,
        role: 'driver',
      }
    });

    if (signUpError) {
      console.error('Error creating auth user:', signUpError);
      return NextResponse.json({ error: signUpError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 });
    }

    // Create user profile
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email: driverData.email.toLowerCase().trim(),
        full_name: driverData.full_name,
        phone_number: driverData.phone_number,
        role: 'driver',
      });

    if (profileError) {
      console.error('Error creating user profile:', profileError);
      // Clean up: delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 });
    }

    // Create driver profile
    const { error: driverProfileError } = await supabaseAdmin
      .from('driver_profiles')
      .insert({
        user_id: authData.user.id,
        is_active: true,
        license_number: driverData.license_number,
        vehicle_make: driverData.vehicle_make,
        vehicle_model: driverData.vehicle_model,
        vehicle_year: driverData.vehicle_year,
        vehicle_color: driverData.vehicle_color,
        vehicle_plate: driverData.vehicle_plate,
      });

    if (driverProfileError) {
      console.error('Error creating driver profile:', driverProfileError);
      // Clean up: delete the auth user if driver profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: 'Failed to create driver profile' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Driver created successfully' });
  } catch (error) {
    console.error('Error in create driver API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { driverId, ...driverData } = await request.json();

    // Update user profile if name or phone number is provided
    if (driverData.full_name || driverData.phone_number) {
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .update({
          ...(driverData.full_name && { full_name: driverData.full_name }),
          ...(driverData.phone_number && { phone_number: driverData.phone_number }),
        })
        .eq('id', driverId);

      if (profileError) {
        return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 });
      }
    }

    // Update driver profile
    const { error: driverProfileError } = await supabaseAdmin
      .from('driver_profiles')
      .update({
        ...(driverData.license_number && { license_number: driverData.license_number }),
        ...(driverData.vehicle_make && { vehicle_make: driverData.vehicle_make }),
        ...(driverData.vehicle_model && { vehicle_model: driverData.vehicle_model }),
        ...(driverData.vehicle_year && { vehicle_year: driverData.vehicle_year }),
        ...(driverData.vehicle_color && { vehicle_color: driverData.vehicle_color }),
        ...(driverData.vehicle_plate && { vehicle_plate: driverData.vehicle_plate }),
        ...(typeof driverData.is_active === 'boolean' && { is_active: driverData.is_active }),
      })
      .eq('user_id', driverId);

    if (driverProfileError) {
      return NextResponse.json({ error: 'Failed to update driver profile' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Driver updated successfully' });
  } catch (error) {
    console.error('Error in update driver API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('id');

    if (!driverId) {
      return NextResponse.json({ error: 'Driver ID is required' }, { status: 400 });
    }

    // Check for assigned trips
    const { data: assignedTrips, error: tripsError } = await supabaseAdmin
      .from('trips')
      .select('id')
      .eq('driver_id', driverId)
      .in('status', ['scheduled', 'en-route']);

    if (tripsError) {
      console.error('Error checking assigned trips:', tripsError);
      return NextResponse.json({ error: 'Failed to check assigned trips' }, { status: 500 });
    }

    // If there are assigned trips, update them
    if (assignedTrips && assignedTrips.length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('trips')
        .update({
          driver_id: null,
          status: 'scheduled',
          updated_at: new Date().toISOString()
        })
        .eq('driver_id', driverId)
        .in('status', ['scheduled', 'en-route']);

      if (updateError) {
        console.error('Error updating assigned trips:', updateError);
        return NextResponse.json({ error: 'Failed to update assigned trips' }, { status: 500 });
      }
    }

    // Delete the auth user (this will cascade delete the profiles due to foreign key constraints)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(driverId);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete driver' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Driver deleted successfully',
      reassignedTrips: assignedTrips?.length || 0
    });
  } catch (error) {
    console.error('Error in delete driver API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
} 