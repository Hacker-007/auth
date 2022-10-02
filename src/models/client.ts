import Zod, { object, string } from 'zod'
import { uuid } from '@src/validation'

function validateRedirectURLHasNoFragment(url: string) {
  return new URL(url).hash === '#'
}

/*
  This function validates a given redirect URL to the specification
  listed in https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-06#2.3.1
  regarding the registration requirements of a client and the format allowed for
  the redirect URI's specified by these clients.
*/
function validateRedirectURLIsSecure(url: string) {
  const urlObject = new URL(url)
  if (
    urlObject.protocol === 'http:' &&
    !urlObject.host.startsWith('localhost')
  ) {
    return false
  } else if (
    urlObject.protocol !== 'https:' &&
    // TODO: Improve the checking of the URL to check if the private-use URL is reverse domain name based.
    urlObject.protocol.includes('.')
  ) {
    return true
  }

  return urlObject.protocol === 'https:'
}

export const ClientSchema = object({
  client_type: Zod.enum(['public', 'confidential']),
  client_id: uuid(),
  client_public_key: string().optional(),
  redirect_uris: string()
    .url()
    .refine(validateRedirectURLHasNoFragment, {
      message:
        'The property `{PROPERTY_NAME}` contains an URL that has a fragment, which is not allowed.',
    })
    .refine(validateRedirectURLIsSecure, {
      message:
        'The property `{PROPERTY_NAME}` is in a format which is not allowed. Please ensure that the URL is using https, or if using http, ensure that the host is localhost. If using a private-use URL, ensure that the URL is formatted to be reverse domain name based.',
    })
    .array(),
})

export type Client = Zod.infer<typeof ClientSchema>
