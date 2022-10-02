import { AuthorizationCodeInfo } from '@src/models/authorizationCodeInfo'
import { randomBytes } from 'crypto'

export interface IAuthorizationTokenService {
  storeAuthorizationCodeInfo(
    authorizationCodeInfo: Required<
      Pick<AuthorizationCodeInfo, 'redirect_uri'>
    > &
      Omit<AuthorizationCodeInfo, 'redirect_uri'>
  ): Promise<string>

  getStoredAuthorizationCodeInfo(
    authorizationCode: string
  ): Promise<AuthorizationCodeInfo | undefined>

  useAuthorizationCode(authorizationCode: string): Promise<void>
  purgeRefreshToken(refreshToken: string): Promise<void>
}

export class InMemoryAuthorizationTokenService
  implements IAuthorizationTokenService
{
  private readonly authorizationCodes: Map<string, AuthorizationCodeInfo>
  private readonly accessTokens: Map<string, string>
  private readonly refreshTokens: Set<string>

  constructor() {
    this.authorizationCodes = new Map()
    this.accessTokens = new Map()
    this.refreshTokens = new Set()
  }

  async storeAuthorizationCodeInfo(
    authorizationCodeInfo: Required<
      Pick<AuthorizationCodeInfo, 'redirect_uri'>
    > &
      Omit<AuthorizationCodeInfo, 'redirect_uri'>
  ): Promise<string> {
    const authorizationCode = randomBytes(128).toString('base64')
    this.authorizationCodes.set(authorizationCode, authorizationCodeInfo)
    return authorizationCode
  }

  async getStoredAuthorizationCodeInfo(
    authorizationCode: string
  ): Promise<AuthorizationCodeInfo | undefined> {
    /*
      Check to see if the authorization code has already been used.
      If so, we need to return undefined to allow the server to deny
      the request and we need to purge all associated access and refresh
      tokens. Since it is guaranteed that each authorization code is
      used only once, there is at most one refresh token that is bound
      this code. However, there may be multiple access tokens that are
      associated with that refresh token, so perhaps we need to invalidate
      these access tokens. However, if I used self-contained access tokens,
      then there would be no way to perform the invalidation.
     */
    const info = this.authorizationCodes.get(authorizationCode)
    if (info?.is_used) {
      // Perform the step of purging the associated refresh tokens and
      // access tokens. How?
      // Authorization Code -> Client Id, Redirect URI, Code Challenge & Method, Refresh Token
      // Access Token ID -> Refresh Token
      // {Refresh Token}
      // When the authorization code is used once, it will be placed into a "used" state. Also,
      // the access token that was redeemed from this code will be associated with it. From here,
      // until the code expires, if the code is used again, then the associated refresh token must
      // be invalidated. Since I am planning to use self-contained tokens for now, it is probably
      // best to limit the TTL to 1 minute.
      if (info.refresh_token) {
        this.purgeRefreshToken(info.refresh_token)
      }

      return undefined
    }

    return info
  }

  async useAuthorizationCode(authorizationCode: string) {
    const info = this.authorizationCodes.get(authorizationCode)
    if (info) {
      this.authorizationCodes.set(authorizationCode, {
        ...info,
        is_used: true,
      })
    }
  }

  async purgeRefreshToken(refreshToken: string) {
    this.refreshTokens.delete(refreshToken)
  }
}
