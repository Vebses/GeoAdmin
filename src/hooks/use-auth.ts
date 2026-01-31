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

  // Fetch user profile from database using auth user ID
  const fetchUserProfile = useCallback(async (authUserId: string) => {
    try {
      const supabase = createClient();
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUserId)
        .single();

      if (profileError || !profileData) {
        console.error('[useAuth] Profile fetch error:', profileError);
        setState({ user: null, isLoading: false, isAuthenticated: false });
        return;
      }

      const userProfile = profileData as User;
      console.log('[useAuth] Profile loaded:', userProfile.role);
      setState({
        user: userProfile,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error('[useAuth] Error fetching profile:', error);
      setState({ user: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();

    // Initial session check using getSession() instead of getUser()
    const initializeAuth = async () => {
      try {
        console.log('[useAuth] Initializing auth with getSession()');
        const { data: { session }, error } = await supabase.auth.getSession();

        console.log('[useAuth] getSession result:', { hasSession: !!session, userId: session?.user?.id, error });

        if (error || !session?.user) {
          console.log('[useAuth] No session, setting unauthenticated');
          setState({ user: null, isLoading: false, isAuthenticated: false });
          return;
        }

        // Use session.user.id to fetch profile
        await fetchUserProfile(session.user.id);
      } catch (error) {
        console.error('[useAuth] Init error:', error);
        setState({ user: null, isLoading: false, isAuthenticated: false });
      }
    };

    initializeAuth();

    // Subscribe to auth changes - use session directly
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[useAuth] Auth state changed:', event, session?.user?.id);

        if (event === 'SIGNED_IN' && session?.user) {
          // Use session.user.id directly - don't call getUser()!
          fetchUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setState({ user: null, isLoading: false, isAuthenticated: false });
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          fetchUserProfile(session.user.id);
        } else if (event === 'INITIAL_SESSION' && session?.user) {
          // Handle initial session event
          fetchUserProfile(session.user.id);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

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

    // Auth state change will trigger profile fetch automatically
    router.push('/dashboard');
    router.refresh();

    return result;
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setState({ user: null, isLoading: false, isAuthenticated: false });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }, [router]);

  const refreshUser = useCallback(async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await fetchUserProfile(session.user.id);
    }
  }, [fetchUserProfile]);

  return {
    ...state,
    login,
    logout,
    refreshUser,
  };
}
