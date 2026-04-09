
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const email = 'appreview@ecrinvirtuel.app';
const password = 'EcrinReview2026!';

async function verifyAndCreateDemoAccount() {
  console.log(`Checking if user ${email} exists...`);
  
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('Error listing users:', listError.message);
    return;
  }

  const demoUser = users.find(u => u.email === email);

  if (demoUser) {
    console.log(`User ${email} already exists (ID: ${demoUser.id}).`);
    console.log('Ensuring user is confirmed...');
    
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      demoUser.id,
      { 
        email_confirm: true,
        password: password // Reset password to be sure
      }
    );

    if (updateError) {
      console.error('Error updating user:', updateError.message);
    } else {
      console.log('User confirmed and password reset successfully.');
    }
  } else {
    console.log(`User ${email} does not exist. Creating...`);
    
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { demo_account: true }
    });

    if (createError) {
      console.error('Error creating user:', createError.message);
    } else {
      console.log('User created successfully.');
    }
  }
}

verifyAndCreateDemoAccount();
