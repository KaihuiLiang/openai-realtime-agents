import { headers } from 'next/headers';

export async function getServerBaseUrl(): Promise<string> {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  const requestHeaders = await headers();
  const host = requestHeaders.get('x-forwarded-host') || requestHeaders.get('host');

  if (!host) {
    return 'http://localhost:3000';
  }

  const protocol = requestHeaders.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  return `${protocol}://${host}`;
}