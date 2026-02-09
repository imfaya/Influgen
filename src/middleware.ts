import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Routes that don't require authentication
const publicRoutes = [
    '/auth/login',
    '/auth/register',
    '/auth/callback',
    '/auth/forgot-password',
    '/auth/reset-password',
];

// Routes that should redirect authenticated users away
const authRoutes = [
    '/auth/login',
    '/auth/register',
];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip middleware for API routes and static files
    if (
        pathname.startsWith('/api') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon') ||
        pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    // Check if route is public
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

    // Get the Supabase session from cookies
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        // If Supabase is not configured, allow all routes
        return NextResponse.next();
    }

    // Create a Supabase client with the cookies
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: false,
        },
    });

    // Get session from cookies
    const accessToken = request.cookies.get('sb-access-token')?.value;
    const refreshToken = request.cookies.get('sb-refresh-token')?.value;

    let isAuthenticated = false;
    let userProfile: { username: string } | null = null;

    if (accessToken && refreshToken) {
        try {
            const { data: { user }, error } = await supabase.auth.getUser(accessToken);

            if (!error && user) {
                isAuthenticated = true;

                // Only fetch profile if we need it for auth route redirection OR root redirection
                if (isAuthRoute || pathname === '/') {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('username')
                        .eq('id', user.id)
                        .single();

                    userProfile = profile;
                }
            }
        } catch {
            isAuthenticated = false;
        }
    }

    // Redirect authenticated users away from auth pages
    if (isAuthenticated && isAuthRoute && userProfile) {
        return NextResponse.redirect(new URL(`/${userProfile.username}/dashboard`, request.url));
    }

    // REVERTED STRICT CHECKS TO FIX ACCESS
    // For now, we'll rely on client-side auth checking for protection
    // This allows the app to load even if middleware fails to detect session

    return NextResponse.next();

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
    ],
};
