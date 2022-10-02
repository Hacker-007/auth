import { uuid } from '@src/validation'
import Zod, { literal, object, string } from 'zod'

export const AuthorizationRequestSchema = object({
  response_type: literal('code'),
  client_id: uuid(),
  code_challenge: string(),
  code_challenge_method: Zod.enum(['plain', 'S256']).default('plain'),
  redirect_uri: string().url().optional(),
  scope: string(),
  state: string(),
})

export type AuthorizationRequest = Zod.infer<typeof AuthorizationRequestSchema>
