import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  name: string;
  role: 'admin' | 'staff' | 'supplier';
  created_at: string;
  updated_at: string;
  supplier_id?: string | null;
  organization_id?: string | null;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeOrgId, setActiveOrgId] = useState<string>(() => localStorage.getItem('logiflow_active_org_id') || 'mock-org-1');
  const [organizations, setOrganizations] = useState<{ id: string; name: string }[]>([
    { id: 'mock-org-1', name: 'LogiFlow Hub Demo Org' },
    { id: 'mock-org-2', name: 'Global Logistics Partners' },
    { id: 'mock-org-3', name: 'Apex Warehousing' }
  ]);

  const switchOrganization = (id: string) => {
    setActiveOrgId(id);
    localStorage.setItem('logiflow_active_org_id', id);
    const selected = organizations.find((o) => o.id === id);
    toast.success(`Switched active workspace to "${selected?.name || id}"`);
    window.dispatchEvent(new CustomEvent('logiflow_org_changed', { detail: id }));
  };


  const cleanupAuthState = () => {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-') || key === 'sb_mock_session') {
        localStorage.removeItem(key);
      }
    });
  };

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        if (error) throw error;
        
        if (isMounted && data) {
          const userProfile = data as UserProfile;
          setProfile(userProfile);
          if (userProfile.organization_id) {
            setActiveOrgId(userProfile.organization_id);
            localStorage.setItem('logiflow_active_org_id', userProfile.organization_id);
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        if (isMounted) {
          setProfile(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Load mock session if it exists
    const mockSessionStr = localStorage.getItem('sb_mock_session');
    if (mockSessionStr) {
      try {
        const { user: mockUser, profile: mockProfile } = JSON.parse(mockSessionStr);
        if (isMounted) {
          setUser(mockUser);
          setProfile(mockProfile);
          const mockSession: Session = {
            access_token: 'mock-access-token',
            token_type: 'bearer',
            expires_in: 3600,
            refresh_token: 'mock-refresh-token',
            user: mockUser
          };
          setSession(mockSession);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to parse mock session:', err);
      }
    }

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        const hasMockSession = !!localStorage.getItem('sb_mock_session');
        if (hasMockSession && !session) {
          // Keep mock session active
          return;
        }
        
        if (session) {
          localStorage.removeItem('sb_mock_session');
          setSession(session);
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      cleanupAuthState();
      
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }

      let data: { user: User | null; session: Session | null } | null = null;
      let error: Error | { message: string } | null = null;

      try {
        const response = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        data = response.data;
        error = response.error;
      } catch (supabaseError: unknown) {
        console.warn("Supabase auth connection failed, attempting mock login fallback:", supabaseError);
        error = supabaseError instanceof Error ? supabaseError : new Error(String(supabaseError));
      }

      if (error) {
        const isDemoAdmin = email === 'admin@logiflow.com' && password === 'admin123';
        const isDemoStaff = email === 'staff@logiflow.com' && password === 'staff123';
        const isDemoSupplier = email === 'supplier@logiflow.com' && password === 'supplier123';

        if (isDemoAdmin || isDemoStaff || isDemoSupplier) {
          const role = isDemoAdmin ? 'admin' : (isDemoStaff ? 'staff' : 'supplier');
          const mockUser: User = {
            id: isDemoAdmin ? 'mock-admin-id-123' : (isDemoStaff ? 'mock-staff-id-123' : 'mock-supplier-id-123'),
            email: email,
            app_metadata: {},
            user_metadata: { name: isDemoAdmin ? 'Demo Admin' : (isDemoStaff ? 'Demo Staff' : 'Demo Supplier'), role },
            aud: 'authenticated',
            created_at: new Date().toISOString()
          };
          const mockProfile: UserProfile = {
            id: isDemoAdmin ? 'mock-admin-profile-id' : (isDemoStaff ? 'mock-staff-profile-id' : 'mock-supplier-profile-id'),
            user_id: mockUser.id,
            email: email,
            name: isDemoAdmin ? 'Demo Admin' : (isDemoStaff ? 'Demo Staff' : 'Demo Supplier'),
            role: role,
            supplier_id: isDemoSupplier ? 'demo-sup-1' : undefined,
            organization_id: 'mock-org-1',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          const mockSession: Session = {
            access_token: 'mock-access-token',
            token_type: 'bearer',
            expires_in: 3600,
            refresh_token: 'mock-refresh-token',
            user: mockUser
          };

          // Save to localStorage
          localStorage.setItem('sb_mock_session', JSON.stringify({ user: mockUser, profile: mockProfile }));
          
          // Set state
          setUser(mockUser);
          setSession(mockSession);
          setProfile(mockProfile);
          
          const displayRole = role === 'admin' ? 'Admin' : (role === 'staff' ? 'Staff' : 'Supplier');
          toast.success(`Successfully signed in as Demo ${displayRole} (Offline Fallback)!`);
          return { success: true };
        }
        
        throw error;
      }
      
      if (data?.user) {
        toast.success('Successfully signed in!');
        return { success: true };
      }
      
      return { success: false, error: 'Login failed' };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const signUp = async (email: string, password: string, name: string, role: 'admin' | 'staff' | 'supplier') => {
    try {
      cleanupAuthState();
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name,
            role
          }
        }
      });

      if (error) throw error;
      
      toast.success('Account created successfully!');
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Signup failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const signOut = async () => {
    try {
      cleanupAuthState();
      
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Ignore errors
      }
      
      toast.success('Successfully signed out!');
      window.location.href = '/';
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Signout failed';
      toast.error(errorMessage);
    }
  };

  return {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    activeOrgId,
    organizations,
    switchOrganization,
    activeOrgName: organizations.find(o => o.id === activeOrgId)?.name || 'Demo Org',
    isAuthenticated: !!user,
    isAdmin: profile?.role === 'admin',
    isStaff: profile?.role === 'staff',
    isSupplier: profile?.role === 'supplier'
  };
};