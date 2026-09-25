import { z } from "zod";

export const BlockedSiteSchema = z.object({
  id: z.number(),
  owner_id: z.number(),
  domain: z.string(),
  is_active: z.boolean(),
});

export type BlockedSite = z.infer<typeof BlockedSiteSchema>;

// Schema de validación para el input del usuario (antes de mandarlo al backend)
export const DomainInputSchema = z.object({
  domain: z
    .string()
    .min(3, "El dominio debe tener al menos 3 caracteres")
    .transform((v) => 
      v.trim()
       .toLowerCase()
       .replace(/^https?:\/\//, "")
       .replace(/^www\./, "")
       .replace(/\/.*$/, "")
    )
    .refine(
      (v) => /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/.test(v),
      "Escribe un dominio válido, ej. facebook.com"
    ),
});
