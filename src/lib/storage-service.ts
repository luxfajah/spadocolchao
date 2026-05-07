import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

/**
 * BUCKET CONFIGURATION:
 * Ensure you have a bucket named 'documents' in your Supabase project
 * with 'public' access or appropriate RLS policies.
 */
const DEFAULT_BUCKET = "documents";

export async function uploadFile(
  path: string,
  buffer: Buffer,
  contentType: string = "application/pdf"
) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    console.error("ERRO DE CONFIGURAÇÃO: NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY não definidos.");
  }

  const { data, error } = await supabase.storage
    .from(DEFAULT_BUCKET)
    .upload(path, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    console.error("Supabase Storage Error:", error);
    // If you get a 'Bucket not found' error, you need to create the 'documents' bucket in Supabase Dashboard
    throw new Error(`Erro ao fazer upload para o Supabase Storage (Bucket: ${DEFAULT_BUCKET}): ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from(DEFAULT_BUCKET)
    .getPublicUrl(path);

  return publicUrl;
}
