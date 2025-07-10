// Auth.js v5 handles authentication automatically
// Use the auth() function directly in API routes for authentication checks
// Example: const session = await auth(); if (!session?.user) return new Response('Unauthorized', { status: 401 });

export interface AuthenticatedRequest {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    status: string;
  };
}
