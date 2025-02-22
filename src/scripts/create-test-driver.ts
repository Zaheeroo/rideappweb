import { supabase } from '@/lib/supabase';

async function createTestDriver() {
  try {
    // Create auth user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: 'testdriver@example.com',
      password: 'testdriver123',
      options: {
        data: {
          full_name: 'Test Driver',
          role: 'driver',
        },
      },
    });

    if (signUpError) {
      console.error('Error creating auth user:', signUpError);
      return;
    }

    if (!authData.user) {
      console.error('No user data returned');
      return;
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email: 'testdriver@example.com',
        full_name: 'Test Driver',
        phone_number: '+1234567890',
        role: 'driver',
      });

    if (profileError) {
      console.error('Error creating user profile:', profileError);
      return;
    }

    // Create driver profile
    const { error: driverProfileError } = await supabase
      .from('driver_profiles')
      .insert({
        user_id: authData.user.id,
        is_active: true,
        license_number: 'DL123456',
        vehicle_make: 'Toyota',
        vehicle_model: 'Camry',
        vehicle_year: 2022,
        vehicle_color: 'Silver',
        vehicle_plate: 'ABC123',
      });

    if (driverProfileError) {
      console.error('Error creating driver profile:', driverProfileError);
      return;
    }

    console.log('Test driver created successfully!');
    console.log('Email: testdriver@example.com');
    console.log('Password: testdriver123');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the function
createTestDriver(); 