export function log(message: string, data?: any): void {
  console.log(`[${new Date().toISOString()}] ${message}`, data ? JSON.stringify(data) : '');
}

export function error(message: string, err: Error): void {
  console.error(`[${new Date().toISOString()}] ERROR: ${message}`, err);
}