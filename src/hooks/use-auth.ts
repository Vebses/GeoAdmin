'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const fetchUser = useCallback(async () => {
    console.log('[useAuth] fetchUser called');
    try {
      const supabase = createClient();
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      console.log('[useAuth] getUser result:', { authUser: authUser?.id, authError });

      if (!authUser) {
        console.log('[useAuth] No auth user, setting isLoading: false');
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
        return;
      }

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      console.log('[useAuth] Profile result:', { profile: profileData, profileError });

      const userProfile = profileData as User | null;

      console.log('[useAuth] Setting state with user:', userProfile?.role);
      setState({
        user: userProfile,
        isLoading: false,
        isAuthenticated: !!userProfile,
      });
    } catch (error) {
      console.error('[useAuth] Error fetching user:', error);
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  }, []);

  useEffect(() => {
    fetchUser();

    // Subscribe to auth changes
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await fetchUser();
        } else if (event === 'SIGNED_OUT') {
          setState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUser]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'შესვლა ვერ მოხერხდა');
    }

    await fetchUser();
    router.push('/dashboard');
    router.refresh();

    return result;
  }, [fetchUser, router]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
      
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }, [router]);

  const refreshUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  return {
    ...state,
    login,
    logout,
    refreshUser,
  };
}
