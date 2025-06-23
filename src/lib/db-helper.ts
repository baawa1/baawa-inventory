import { createClient } from '@supabase/supabase-js';

// Supabase client for direct database operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dbHelper = {
  // User operations
  async findUserByEmail(email: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('isActive', true)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      throw error;
    }
    
    return data;
  },

  async findUserByResetToken(token: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('reset_token', token)
      .eq('isActive', true)
      .gt('reset_token_expires', new Date().toISOString())
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    return data;
  },

  async updateUserResetToken(userId: number, resetToken: string, resetTokenExpires: Date) {
    const { data, error } = await supabase
      .from('users')
      .update({
        reset_token: resetToken,
        reset_token_expires: resetTokenExpires.toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  },

  async updateUserPassword(userId: number, hashedPassword: string) {
    const { data, error } = await supabase
      .from('users')
      .update({
        password: hashedPassword,
        reset_token: null,
        reset_token_expires: null,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  },
};
