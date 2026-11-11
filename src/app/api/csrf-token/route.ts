import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';

/** Generate a CSRF token, store it in a HttpOnly cookie, and return it in JSON. */
export async function GET() {
  const token = randomBytes(32).toString('hex');
  const response = NextResponse.json({ token });
  // HttpOnly, Secure (in production), SameSite=Strict to mitigate CSRF.
  response.cookies.set('csrf-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60, // 1 hour
  });
  return response;
}

