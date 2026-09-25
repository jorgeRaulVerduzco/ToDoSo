import { z } from "zod";

export const LoginCredentialsSchema = z.object({
  username: z.string().min(1, "Ingresa tu usuario"),
  password: z.string().min(1, "Ingresa tu contraseña"),
  rememberMe: z.boolean().default(true),
});

export type LoginCredentials = z.infer<typeof LoginCredentialsSchema>;

export const TokenPairSchema = z.object({
  access: z.string(),
  refresh: z.string(),
});

export type TokenPair = z.infer<typeof TokenPairSchema>;
