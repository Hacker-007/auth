import { setErrorMap, ZodErrorMap, ZodIssueCode } from 'zod'

const validationErrorMap: ZodErrorMap = (issue, ctx) => {
  const propertyName = issue.path.join('.')
  if (issue.code === ZodIssueCode.invalid_type) {
    if (issue.received === 'undefined') {
      return { message: `The property \`${propertyName}\` must be provided.` }
    } else {
      return {
        message: `The property \`${propertyName}\` was expected to be of type \`${issue.expected}\` but was found to be of type \`${issue.received}\`.`,
      }
    }
  } else if (issue.code === ZodIssueCode.unrecognized_keys) {
    if (issue.keys.length > 1) {
      let keys = ''
      for (let idx = 0; idx < issue.keys.length; idx++) {
        keys += `\`${issue.keys[idx]}\``
        if (idx === issue.keys.length - 2) {
          keys += ', and '
        } else if (idx <= issue.keys.length - 1) {
          keys += ', '
        }
      }

      return {
        message: `The keys ${keys} are not allowed.`,
      }
    }

    return {
      message: `The key \`${issue.keys[0]}\` is not allowed.`,
    }
  } else if (issue.code === ZodIssueCode.invalid_enum_value) {
    if (issue.options.length > 1) {
      let options = ''
      for (let idx = 0; idx < issue.options.length; idx++) {
        options += `\`${issue.options[idx]}\``
        if (idx === issue.options.length - 2) {
          options += ', and '
        } else if (idx <= issue.options.length - 1) {
          options += ', '
        }
      }

      return {
        message: `The value \`${issue.received}\` is not a valid value for the property \`${propertyName}\`. Legal options include ${options}`,
      }
    }

    return {
      message: `The value \`${issue.received}\` is not a valid value for the property \`${propertyName}\`. The only legal option is ${issue.options[0]}`,
    }
  } else if (issue.code === ZodIssueCode.custom) {
    return {
      message:
        issue.message?.replaceAll('{PROPERTY_NAME}', propertyName) ||
        'An unknown error occurred.',
    }
  }

  return { message: ctx.defaultError }
}

setErrorMap(validationErrorMap)
