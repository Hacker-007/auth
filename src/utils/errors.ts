type APIErrorType =
  | 'invalid_request'
  | 'invalid_client'
  | 'invalid_grant'
  | 'unauthorized_client'
  | 'unsupported_grant_type'
  | 'invalid_scope'

class APIError extends Error {
  readonly errorType: APIErrorType
  readonly errorDescription?: string
  readonly errorUri?: URL

  constructor(
    errorType: APIErrorType,
    errorDescription?: string,
    errorUri?: URL
  ) {
    super()
    this.errorType = errorType
    this.errorDescription = errorDescription
    this.errorUri = errorUri
  }
}

function getHttpErrorStatusCode(_error: APIError): number {
  return 400
}

export { APIError, getHttpErrorStatusCode }
