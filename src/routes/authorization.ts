import { Request, Response } from 'express'
import { validateAgainstSchema } from '@src/validation'
import { AuthorizationRequestSchema } from '@src/models/authorizationRequest'
import { IClientService } from '@src/service/clientService'
import { APIError } from '@src/utils/errors'
import { IAuthorizationRequestService } from '@src/service/authorizationRequestService'
import { IAuthorizationTokenService } from '@src/service/authorizationTokenService'

/*
 *
 * Processes the authorization request according to the
 * https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-01#section-4.1.1.3.
 *
 */
export const authorizationGetFactory =
  (
    clientService: IClientService,
    authorizationRequestService: IAuthorizationRequestService
  ) =>
  async (req: Request, res: Response) => {
    try {
      const authorizationRequest = await validateAgainstSchema(
        req.query,
        AuthorizationRequestSchema
      )

      if (authorizationRequest.response_type === 'code') {
        const client = await clientService.getClientById(
          authorizationRequest.client_id
        )

        if (
          authorizationRequest.redirect_uri &&
          !client.redirect_uris.includes(authorizationRequest.redirect_uri)
        ) {
          throw new APIError(
            'invalid_request',
            `The redirect URL \`${authorizationRequest.redirect_uri}\` is not valid.`
          )
        } else if (
          !authorizationRequest.redirect_uri &&
          client.redirect_uris.length > 1
        ) {
          throw new APIError(
            'invalid_request',
            'A redirect URL was expected, however, no URL was found.'
          )
        }

        // Store the authorization request in a session store, while storing the
        // opaque session id in a secure cookie to be able to retrieve the information
        // when generating the authentication response.
        const requestId =
          await authorizationRequestService.temporarilyStoreAuthorizationRequest(
            {
              ...authorizationRequest,
              redirect_uri:
                authorizationRequest.redirect_uri ?? client.redirect_uris[0],
            }
          )

        // Redirect the user to the authentication and authorization page
        // along with a cookie representing the authentication request.
        res
          .cookie('OAuthAuthorizationRequestId', requestId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            expires: new Date(Date.now() + 1000 * 60 * 60),
          })
          .redirect('/oauth/interaction/authorize')
      }
    } catch (e) {
      if (e instanceof APIError) {
        // TODO: Change the URL redirected to based on the type of error
        // If the error relates to redirect URI's, then redirect to
        // /oaut/interaction/error, otherwise redirect to the provided
        // redirect URI with the correct error query parameters.
        const redirectURL = new URL('/oauth/interaction/error')
        redirectURL.searchParams.append('type', e.errorType)
        if (e.errorDescription) {
          redirectURL.searchParams.append('description', e.errorDescription)
        }

        if (e.errorUri) {
          redirectURL.searchParams.append('errorUri', e.errorUri.href)
        }

        res.redirect(redirectURL.href)
      }
    }
  }

export const onAuthorizationResponsePostFactory =
  (
    authorizationRequestService: IAuthorizationRequestService,
    authorizationCodeService: IAuthorizationTokenService
  ) =>
  async (req: Request, res: Response) => {
    const requestId = req.cookies['OAuthAuthorizationRequestId']
    if (requestId) {
      const authorizationRequest =
        await authorizationRequestService.getStoredAuthorizationRequest(
          requestId
        )

      if (authorizationRequest) {
        const authorizationCode =
          await authorizationCodeService.storeAuthorizationCodeInfo({
            client_id: authorizationRequest.client_id,
            code_challenge: authorizationRequest.code_challenge,
            code_challenge_method: authorizationRequest.code_challenge_method,
            redirect_uri: authorizationRequest.redirect_uri,
            scope: authorizationRequest.scope,
            is_used: false,
          })

        const redirectURL = new URL(authorizationRequest.redirect_uri)
        redirectURL.searchParams.append('code', authorizationCode)
        redirectURL.searchParams.append('state', authorizationRequest.state)
        res.redirect(redirectURL.href)
      }
    } else {
      // TODO: Change the URL redirected to based on the type of error
      // If the error relates to redirect URI's, then redirect to
      // /oaut/interaction/error, otherwise redirect to the provided
      // redirect URI with the correct error query parameters.
      const redirectURL = new URL('/oauth/interaction/error')
      redirectURL.searchParams.append('type', 'invalid_request')
      redirectURL.searchParams.append(
        'description',
        'The request did not contain a required cookie.'
      )

      res.redirect(redirectURL.href)
    }
  }
