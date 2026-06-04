import { createServiceClient } from '@/lib/supabaseAdmin';

export async function GET() {
  const configured = Boolean(createServiceClient());
  return Response.json({ configured });
}
