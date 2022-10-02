import { AuthorizationRequest } from '@src/models/authorizationRequest'
import { v4 as uuidv4 } from 'uuid'

export interface IAuthorizationRequestService {
  temporarilyStoreAuthorizationRequest(
    authorizationRequest: Required<AuthorizationRequest>
  ): Promise<string>

  getStoredAuthorizationRequest(
    id: string
  ): Promise<Required<AuthorizationRequest> | undefined>
}

export class InMemoryAuthorizationRequestService
  implements IAuthorizationRequestService
{
  private readonly authorizationRequests: Map<
    string,
    Required<AuthorizationRequest>
  >

  constructor() {
    this.authorizationRequests = new Map()
  }

  async temporarilyStoreAuthorizationRequest(
    authorizationRequest: Required<AuthorizationRequest>
  ): Promise<string> {
    const requestId = uuidv4()
    this.authorizationRequests.set(requestId, authorizationRequest)
    return requestId
  }

  async getStoredAuthorizationRequest(
    id: string
  ): Promise<Required<AuthorizationRequest> | undefined> {
    return this.authorizationRequests.get(id)
  }
}
