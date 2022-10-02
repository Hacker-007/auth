import { Request, Response } from 'express'
import { Client } from '@src/models/client'
import { TokenRequestSchema } from '@src/models/tokenRequest'
import { IClientService } from '@src/service/clientService'
import { APIError } from '@src/utils/errors'
import { uuid, validateAgainstSchema } from '@src/validation'
import { decode, verify } from 'jsonwebtoken'
import { PrivateKeyJWTAuthenticationSchema } from '@src/models/privateKeyJWTAuthentication'
import { IAuthorizationTokenService } from '@src/service/authorizationTokenService'
import { createHash } from 'crypto'

function isCodeVerifierValid(
  codeVerifier: string,
  codeChallenge: string,
  codeChallengeMethod: 'plain' | 'S256'
) {
  if (codeChallengeMethod === 'plain') {
    return codeVerifier === codeChallenge
  } else {
    return (
      createHash('sha256').update(codeVerifier).digest('base64url') ===
      codeChallenge
    )
  }
}

export const tokenPostFactory =
  (
    clientService: IClientService,
    authorizationCodeService: IAuthorizationTokenService
  ) =>
  async (req: Request, res: Response) => {
    const tokenRequest = await validateAgainstSchema(
      req.body,
      TokenRequestSchema
    )

    if (tokenRequest.grant_type === 'authorization_code') {
      let client: Client
      if (tokenRequest.client_id) {
        client = await clientService.getClientById(tokenRequest.client_id)
      } else {
        client = await parseClientAuthentication(req, clientService)
      }

      const codeInfo =
        await authorizationCodeService.getStoredAuthorizationCodeInfo(
          tokenRequest.code
        )
      if (codeInfo === undefined) {
        throw new APIError(
          'invalid_grant',
          'The provided authorization code is invalid.'
        )
      }

      if (
        client.client_id === codeInfo.client_id &&
        isCodeVerifierValid(
          tokenRequest.code_verifier,
          codeInfo.code_challenge,
          codeInfo.code_challenge_method
        )
      ) {
        if (
          (!tokenRequest.redirect_uri && !codeInfo.redirect_uri) ||
          (tokenRequest.redirect_uri &&
            codeInfo.redirect_uri &&
            codeInfo.redirect_uri === tokenRequest.redirect_uri)
        ) {
          res.json({
            access_token: uuid(),
            refresh_token: uuid(),
            token_type: 'bearer',
            expires_in: 3600,
            scope: codeInfo.scope,
          })
        }
      }

      throw new APIError(
        'invalid_request',
        'The request details provided does not match the information that was stored on the server.'
      )
    }
  }

async function parseClientAuthentication(
  req: Request,
  clientService: IClientService
): Promise<Client> {
  if (
    req.body.client_assertion_type &&
    req.body.client_assertion_type ===
      'urn:ietf:params:oauth:client-assertion-type:jwt-bearer'
  ) {
    const jwtAssertion = req.body.client_assertion
    const jwtPayload = decode(jwtAssertion)
    if (jwtPayload !== null && typeof jwtPayload === 'object') {
      const payload = await validateAgainstSchema(
        jwtPayload,
        PrivateKeyJWTAuthenticationSchema,
        (_e) =>
          new APIError(
            'invalid_grant',
            'The provided JWT is not a valid form of client authentication.'
          )
      )

      const client = await clientService.getClientById(payload.sub)
      if (
        client.client_public_key &&
        payload.iss === payload.sub &&
        payload.sub === client.client_id &&
        payload.aud === process.env.HOST
      ) {
        const isSignatureValid = verify(jwtAssertion, client.client_public_key)
        if (isSignatureValid) {
          return client
        }
      }
    }
  }

  throw new APIError(
    'invalid_grant',
    'The client must present some valid form of authentication, or in the case of a public client, must include the `client_id` in the body of the request.'
  )
}
