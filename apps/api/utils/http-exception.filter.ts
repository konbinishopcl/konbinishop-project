import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? (exception.getResponse() as { message?: string })?.message ?? 'Error'
        : 'Internal server error';

    if (!(exception instanceof HttpException)) {
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    }

    res.status(status).json({ message, statusCode: status });
  }
}
