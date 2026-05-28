type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Configurable log level from environment variables (e.g. LOG_LEVEL=info)
const CURRENT_LOG_LEVEL = (process.env.LOG_LEVEL?.toLowerCase() as LogLevel) || 'info';
const CURRENT_LEVEL_NUM = LOG_LEVELS[CURRENT_LOG_LEVEL] ?? 1;

function writeLog(level: LogLevel, message: string, metadata?: Record<string, any>) {
  if (LOG_LEVELS[level] < CURRENT_LEVEL_NUM) return;

  const logPayload = {
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    message,
    environment: process.env.NODE_ENV || 'development',
    ...metadata,
  };

  // Production: Log structured JSON (highly optimized for Axiom / Datadog / Vercel Logs)
  if (process.env.NODE_ENV === 'production') {
    const logString = JSON.stringify(logPayload);
    if (level === 'error') {
      console.error(logString);
    } else {
      console.log(logString);
    }
  } else {
    // Development: Pretty console output for developer readability
    const colorMap: Record<LogLevel, string> = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m',  // Green
      warn: '\x1b[33m',  // Yellow
      error: '\x1b[31m', // Red
    };
    const reset = '\x1b[0m';
    
    console.log(
      `${colorMap[level]}[${level.toUpperCase()}]${reset} ${message}`,
      metadata ? '\n' + JSON.stringify(metadata, null, 2) : ''
    );
  }
}

export const logger = {
  debug: (message: string, metadata?: Record<string, any>) => writeLog('debug', message, metadata),
  info: (message: string, metadata?: Record<string, any>) => writeLog('info', message, metadata),
  warn: (message: string, metadata?: Record<string, any>) => writeLog('warn', message, metadata),
  error: (message: string, error?: any, metadata?: Record<string, any>) => {
    const errorDetails = error instanceof Error 
      ? { errorName: error.name, errorMessage: error.message, errorStack: error.stack }
      : { rawError: error };
      
    writeLog('error', message, { ...errorDetails, ...metadata });
  },
};
