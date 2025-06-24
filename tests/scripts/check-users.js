const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUsers() {
  try {
    console.log('Checking users in database...');
    
    const { data: users, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, role, user_status, email_verified, is_active')
      .limit(5);

    if (error) {
      console.error('Error fetching users:', error);
      return;
    }

    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`- ${user.first_name} ${user.last_name} (${user.email}) - Role: ${user.role}, Status: ${user.user_status}`);
    });

    // Count users by status
    const { data: statusCounts, error: countError } = await supabase
      .from('users')
      .select('user_status')
      .neq('user_status', null);

    if (!countError && statusCounts) {
      const counts = statusCounts.reduce((acc, user) => {
        acc[user.user_status] = (acc[user.user_status] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\nUser status counts:', counts);
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkUsers();
