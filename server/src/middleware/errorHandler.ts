import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    const firstIssue = err.issues[0];
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: firstIssue?.message || 'Invalid input data.',
        details: err.issues,
      },
    });
  }

  if (err instanceof Error) {
    if (err.message.includes('Mathematical invariant')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVARIANT_ERROR',
          message: err.message,
        },
      });
    }

    if (
      err.message.includes('Bill amount') ||
      err.message.includes('Tip percentage') ||
      err.message.includes('Number of people') ||
      err.message.includes('Bill cents')
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: err.message,
        },
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: err.message || 'An unexpected error occurred.',
      },
    });
  }

  return res.status(500).json({
    success: false,
    error: {
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred.',
    },
  });
}
