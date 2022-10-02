import { uuid } from '@src/validation'
import Zod, { object, string } from 'zod'

export const TokenRequestSchema = object({
  grant_type: Zod.enum([
    'authorization_code',
    'refresh_token',
    'client_credentials',
  ]),
  client_id: uuid().optional(),
  code: string(),
  code_verifier: string(),
  redirect_uri: string().url().optional(),
})

export type TokenRequest = Zod.infer<typeof TokenRequestSchema>
