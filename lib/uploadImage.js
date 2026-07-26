import { supabase } from "./supabaseClient";

/**
 * Sube una imagen a un bucket de Supabase Storage y regresa su URL pública.
 * bucket: 'avatars' | 'planes' | 'experiencias'
 * prefijo: normalmente el id del usuario o del plan, para evitar choques de nombres
 */
export async function subirImagen(bucket, archivo, prefijo) {
  if (!archivo) return null;

  const extension = archivo.name.split(".").pop();
  const nombreArchivo = `${prefijo}-${Date.now()}.${extension}`;

  const { error } = await supabase.storage.from(bucket).upload(nombreArchivo, archivo, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(nombreArchivo);
  return data.publicUrl;
}
