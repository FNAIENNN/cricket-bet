export async function logError(error: Error, context?: Record<string, unknown>) {
  console.error({
    timestamp: new Date().toISOString(),
    error: error.message,
    stack: error.stack,
    context,
  });
}

export async function logInfo(message: string, data?: Record<string, unknown>) {
  console.info({
    timestamp: new Date().toISOString(),
    message,
    data,
  });
}
