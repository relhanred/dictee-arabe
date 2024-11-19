import { NextResponse } from 'next/server'

export const publicRoutes = ['/', '/signin', '/signup']
export const authRoutes = ['/admin']
export const DEFAULT_LOGIN_REDIRECT = '/admin'

export function middleware(request) {
    const { pathname, search, origin } = request.nextUrl

    const isPublicRoute = publicRoutes.includes(pathname)
    const isAuthRoute = authRoutes.includes(pathname)

    const token = request.cookies.get('session')?.value

    if (isAuthRoute && !token) {
        const callbackUrl = `${pathname}${search}`
        return NextResponse.redirect(
            new URL(`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`, request.url)
        )
    }

    if (!isPublicRoute && !token) {
        const callbackUrl = `${pathname}${search}`
        return NextResponse.redirect(
            new URL(`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`, request.url)
        )
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}