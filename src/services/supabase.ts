/**
 * Supabase Client Configuration
 * 
 * This module provides a configured Supabase client for the React Native app.
 * It handles authentication, database operations, and real-time subscriptions.
 */

import 'react-native-url-polyfill/auto';
import { supabase } from '../../utils/supabase';

// Authentication helpers
export const supabaseAuth = {
  /**
   * Sign up with email and password
   */
  signUp: async (email: string, password: string, metadata?: Record<string, any>) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    return { data, error };
  },

  /**
   * Sign in with email and password
   */
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  /**
   * Sign in with phone and OTP
   */
  signInWithPhone: async (phone: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
    });
    return { data, error };
  },

  /**
   * Verify OTP for phone authentication
   */
  verifyOtp: async (phone: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });
    return { data, error };
  },

  /**
   * Sign out
   */
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  /**
   * Get current session
   */
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    return { data, error };
  },

  /**
   * Get current user
   */
  getUser: async () => {
    const { data, error } = await supabase.auth.getUser();
    return { data, error };
  },

  /**
   * Reset password
   */
  resetPassword: async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    return { data, error };
  },

  /**
   * Update password
   */
  updatePassword: async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { data, error };
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// Database helpers
export const supabaseDb = {
  /**
   * Select records from a table
   */
  select: async (table: string, query?: Record<string, any>) => {
    let queryBuilder = supabase.from(table).select('*');
    
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        queryBuilder = queryBuilder.eq(key, value);
      });
    }
    
    const { data, error } = await queryBuilder;
    return { data, error };
  },

  /**
   * Select a single record by ID
   */
  selectById: async (table: string, id: string) => {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  },

  /**
   * Insert a record
   */
  insert: async (table: string, data: Record<string, any>) => {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select();
    return { data: result, error };
  },

  /**
   * Update a record
   */
  update: async (table: string, id: string, data: Record<string, any>) => {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select();
    return { data: result, error };
  },

  /**
   * Delete a record
   */
  delete: async (table: string, id: string) => {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);
    return { error };
  },

  /**
   * Subscribe to real-time changes
   */
  subscribe: (table: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`${table}_changes`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table }, 
        callback
      )
      .subscribe();
  },
};

// Storage helpers
export const supabaseStorage = {
  /**
   * Upload a file
   */
  upload: async (bucket: string, path: string, file: any) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);
    return { data, error };
  },

  /**
   * Download a file
   */
  download: async (bucket: string, path: string) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);
    return { data, error };
  },

  /**
   * Get public URL for a file
   */
  getPublicUrl: (bucket: string, path: string) => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    return data.publicUrl;
  },

  /**
   * Delete a file
   */
  delete: async (bucket: string, path: string) => {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    return { error };
  },

  /**
   * List files in a directory
   */
  list: async (bucket: string, path: string = '') => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path);
    return { data, error };
  },
};

export default supabase;
