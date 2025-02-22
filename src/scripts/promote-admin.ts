import { supabase } from '@/lib/supabase';

async function promoteToAdmin(email: string) {
  try {
    // Update user_profiles table
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({ role: 'admin' })
      .eq('email', email);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      return;
    }

    console.log('Successfully updated user role to admin');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the function
promoteToAdmin('oliver.burgos@gmail.com'); 