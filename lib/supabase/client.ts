import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

const isConfigured = !!supabaseUrl && !!supabaseAnonKey;

if (!isConfigured) {
  console.warn(
    'Supabase environment variables are missing! The client is operating in demo/mock fallback mode.'
  );
}

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

export const createClient = () => {
  if (!isConfigured) {
    return createDummyClient();
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};
