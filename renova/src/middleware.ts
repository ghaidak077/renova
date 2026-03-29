import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const url = request.nextUrl;
  const path = url.pathname;

  // Exclude static files, API routes, internal Next.js routes, and the suspended route itself
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path === '/suspended' ||
    path.includes('.')
  ) {
    return supabaseResponse;
  }

  // Get the slug from the path (e.g., /mystore -> mystore)
  const segments = path.split('/').filter(Boolean);

  if (segments.length > 0) {
    const slug = segments[0];

    try {
      const { data: store, error } = await supabase
        .from('stores')
        .select('subscription_ends_at, status')
        .eq('slug', slug)
        .single();

      if (store) {
        if (store.status === 'suspended') {
            return NextResponse.rewrite(new URL('/suspended', request.url));
        }

        if (store.subscription_ends_at) {
            const endsAt = new Date(store.subscription_ends_at);
            const now = new Date();

            if (now > endsAt) {
                // Subscription expired, redirect/rewrite to /suspended
                return NextResponse.rewrite(new URL('/suspended', request.url));
            }
        }
      }
    } catch (e) {
      console.error('Middleware error checking tenant:', e);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
