import { connection } from "next/server";
import { checkSupabaseHealth } from "@/shared/lib/supabase/health";

export async function GET() {
  // Wait for a real request so Cache Components never prerenders the check.
  await connection();

  const result = await checkSupabaseHealth();
  return Response.json(result, { status: result.supabase === "ok" ? 200 : 503 });
}
