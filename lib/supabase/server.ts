import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

const isConfigured = !!supabaseUrl && !!supabaseAnonKey;

// A safe dummy client proxy that won't throw errors when methods are accessed or called
export const createDummyClient = () => {
  const dummyAuth = {
    getSession: async () => ({ data: { session: null }, error: null }),
    signInWithOtp: async () => ({ data: {}, error: null }),
    signUp: async () => ({ data: {}, error: null }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    getUser: async () => ({ data: { user: null }, error: null }),
  };

  const dummyStorage = {
    from: () => ({
      upload: async () => ({ data: {}, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
    }),
  };

  const dummyChain = {
    select: () => dummyChain,
    insert: () => dummyChain,
    update: () => dummyChain,
    delete: () => dummyChain,
    eq: () => dummyChain,
    order: () => dummyChain,
    single: () => dummyChain,
    then: (resolve: any) => resolve({ data: null, error: null }),
  };

  const client = {
    auth: dummyAuth,
    storage: dummyStorage,
    from: () => dummyChain,
  };

  return client as any;
};

export async function createClient() {
  if (!isConfigured) {
    return createDummyClient();
  }

  const cookieStore = await cookies();

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // This can be ignored if called from a Server Component
          }
        },
      },
    }
  );
}
