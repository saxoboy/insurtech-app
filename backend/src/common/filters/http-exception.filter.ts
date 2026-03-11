import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const detail =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : ((exceptionResponse as any)?.message ?? 'Internal server error');

    // RFC 9457 - Problem Details
    response.status(status).json({
      type: `https://httpstatuses.com/${status}`,
      title: HttpStatus[status] ?? 'Error',
      status,
      detail: Array.isArray(detail) ? detail : [detail],
    });
  }
}
