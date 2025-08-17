import { GetServerSideProps } from 'next';
import jwt from 'jsonwebtoken';
import { parse, serialize } from 'cookie';

const SESSION_COOKIE = 'betx_session';
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable not set');
}
const SESSION_DURATION = 10 * 60; // 10 minutes in seconds

export const requireAuth = (): GetServerSideProps => async (context) => {
  const cookies = context.req.headers.cookie ? parse(context.req.headers.cookie) : {};
  const token = cookies[SESSION_COOKIE];
  if (!token) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // Refresh the session cookie (sliding expiration)
    const newToken = jwt.sign(payload as object, JWT_SECRET, { expiresIn: SESSION_DURATION });
    context.res.setHeader('Set-Cookie', serialize(SESSION_COOKIE, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: SESSION_DURATION,
    }));
    return { props: {} };
  } catch (e) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
}; 