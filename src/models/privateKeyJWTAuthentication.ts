import Zod, { number, object, string } from 'zod'

export const PrivateKeyJWTAuthenticationSchema = object({
  iss: string(),
  sub: string(),
  aud: string(),
  exp: number(),
  nbf: number().optional(),
  iat: number().optional(),
  jti: string().optional(),
})

export type PrivateKeyJWTAuthentication = Zod.infer<
  typeof PrivateKeyJWTAuthenticationSchema
>
