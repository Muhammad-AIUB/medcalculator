import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

// Under high request volume, logging every request synchronously becomes a
// throughput bottleneck (formatting + stdout writes on the hot path). We log
// only what's actionable: errors and slow requests. Normal fast responses are
// not logged. Override the threshold with SLOW_REQUEST_MS.
const SLOW_REQUEST_MS = Number(process.env.SLOW_REQUEST_MS ?? 500);

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          if (duration >= SLOW_REQUEST_MS) {
            this.logger.warn(
              `Slow: ${method} ${url} ${response.statusCode} | ${duration}ms`,
            );
          }
        },
        error: (err: Error) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            `Error: ${method} ${url} | ${duration}ms | ${err.message}`,
          );
        },
      }),
    );
  }
}
