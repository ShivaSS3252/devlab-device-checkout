import { HttpError, UnauthorizedError, ForbiddenError, BadRequestError } from '@/errors/HttpErrors'

export function handleHttpError(error: unknown): string {
  // If it's already an HttpError, return its user message
  if (error instanceof HttpError) {
    return error.userMessage || error.message
  }

  // If it's a business logic error, return the message
  if (error instanceof Error) {
    return error.message
  }

  // Fallback for unknown errors
  return 'An unexpected error occurred'
}

export function getHttpErrorToast(error: unknown) {
  const message = handleHttpError(error)

  // Determine toast type based on error
  if (error instanceof UnauthorizedError) {
    return {
      type: 'error' as const,
      title: 'Session Expired',
      message: 'Please login again to continue'
    }
  }

  if (error instanceof ForbiddenError) {
    return {
      type: 'error' as const,
      title: 'Access Denied',
      message: 'You don\'t have permission to perform this action'
    }
  }

  if (error instanceof BadRequestError) {
    return {
      type: 'error' as const,
      title: 'Invalid Request',
      message: 'Please check your input and try again'
    }
  }

  // Default error toast
  return {
    type: 'error' as const,
    title: 'Error',
    message: message
  }
}

export function createHttpError(statusCode: number, message: string, userMessage?: string): HttpError {
  switch (statusCode) {
    case 400:
      return new BadRequestError(message, userMessage)
    case 401:
      return new UnauthorizedError(message, userMessage)
    case 403:
      return new ForbiddenError(message, userMessage)
    case 404:
      return new HttpError(404, message, userMessage || 'The requested resource was not found')
    case 500:
      return new HttpError(500, message, userMessage || 'Something went wrong, please try again later')
    default:
      return new HttpError(statusCode, message, userMessage || 'An error occurred')
  }
}
