import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

/**
 * Validation Middleware
 * Validates request body, query, and params against Zod schemas
 */
export const validate = (schema: AnyZodObject) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: Record<string, string[]> = {};
        const errorMessages: string[] = [];
        
        error.errors.forEach((err) => {
          // Remove 'body.' prefix from path for cleaner error messages
          const pathParts = err.path.filter(p => p !== 'body' && p !== 'query' && p !== 'params');
          const path = pathParts.join('.');
          
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(err.message);
          errorMessages.push(`${path}: ${err.message}`);
        });

        // Create a user-friendly combined error message
        const message = errorMessages.length > 0 
          ? errorMessages.join('; ') 
          : 'Validation failed';

        next(new ValidationError(message, errors));
      } else {
        next(error);
      }
    }
  };
};

export default validate;
