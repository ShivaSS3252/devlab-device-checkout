export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public userMessage?: string
  ) {
    super(message);
    this.name = `HttpError${statusCode}`;
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string = 'Bad Request', userMessage: string = 'Invalid request, please check your input') {
    super(400, message, userMessage);
    this.name = 'BadRequestError';
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message: string = 'Unauthorized', userMessage: string = 'Session expired, please login again') {
    super(401, message, userMessage);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends HttpError {
  constructor(message: string = 'Forbidden', userMessage: string = 'You don\'t have permission to perform this action') {
    super(403, message, userMessage);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string = 'Not Found', userMessage: string = 'The requested resource was not found') {
    super(404, message, userMessage);
    this.name = 'NotFoundError';
  }
}

export class InternalServerError extends HttpError {
  constructor(message: string = 'Internal Server Error', userMessage: string = 'Something went wrong, please try again later') {
    super(500, message, userMessage);
    this.name = 'InternalServerError';
  }
}
