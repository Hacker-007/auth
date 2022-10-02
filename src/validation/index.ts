import { APIError } from '@src/utils/errors'
import { ZodError, ZodSchema, ZodTypeDef } from 'zod'
import { uuid } from './helpers'

export async function validateAgainstSchema<
  Input,
  Output,
  Def extends ZodTypeDef = ZodTypeDef
>(
  data: unknown,
  schema: ZodSchema<Output, Def, Input>,
  errorFn?: (e: unknown) => APIError
): Promise<Output> {
  try {
    return await schema.parseAsync(data)
  } catch (e) {
    if (errorFn) {
      throw errorFn(e)
    }

    throw new APIError('invalid_request', (e as ZodError).message)
  }
}

export { uuid }
