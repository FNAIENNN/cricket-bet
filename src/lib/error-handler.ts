import { NextResponse } from 'next/server';

export class AppError extends Error {
  statusCode: number;
  code: string;
  
  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'AppError';
  }
}

export function handleError(error: unknown) {
  if (error instanceof AppError) {
    console.error(`[${error.code}] ${error.message}`);
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }
  
  if (error instanceof Error) {
    console.error(error.message);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
  
  return NextResponse.json(
    { error: 'Unknown error occurred', code: 'UNKNOWN_ERROR' },
    { status: 500 }
  );
}
