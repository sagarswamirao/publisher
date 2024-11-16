export function internalErrorToHttpError(error: Error) {
   if (error instanceof BadRequestError) {
      return httpError(400, error.message);
   } else if (error instanceof PackageNotFoundError) {
      return httpError(404, error.message);
   } else if (error instanceof ModelNotFoundError) {
      return httpError(404, error.message);
   } else if (error instanceof ModelCompilationError) {
      return httpError(424, error.message);
   } else {
      return httpError(500, error.message);
   }
}

function httpError(code: number, message: string) {
   return {
      status: code,
      json: {
         content: {
            "application/json": {
               code: code,
               message: message,
            },
         },
      },
   };
}

export class NotImplementedError extends Error {
   constructor(message: string) {
      super(message);
   }
}

export class BadRequestError extends Error {
   constructor(message: string) {
      super(message);
   }
}

export class PackageNotFoundError extends Error {
   constructor(message: string) {
      super(message);
   }
}

export class ModelNotFoundError extends Error {
   constructor(message: string) {
      super(message);
   }
}

export class ModelCompilationError extends Error {
   constructor(message: string) {
      super(message);
   }
}
