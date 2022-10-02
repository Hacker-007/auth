import { uuid } from '@src/validation'
import Zod, { boolean, object, string } from 'zod'

export const AuthorizationCodeInfoSchema = object({
  client_id: uuid(),
  code_challenge: string(),
  code_challenge_method: Zod.enum(['plain', 'S256']).default('plain'),
  redirect_uri: string().url().optional(),
  scope: string(),
  is_used: boolean().default(false),
  refresh_token: string().optional(),
})

export type AuthorizationCodeInfo = Zod.infer<
  typeof AuthorizationCodeInfoSchema
>
