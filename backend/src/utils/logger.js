/**
 * src/utils/logger.js
 * Winston logger configuration for performance metrics and system health.
 * Logs are output to the console as requested by the user.
 */

import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      // If it's a metric log, format it nicely for the console
      if (meta.type === 'metric') {
        const metricsStr = Object.entries(meta.data)
          .map(([k, v]) => `${k}=${v}`)
          .join(' | ');
        return `[${timestamp}] [METRIC] ${message} - ${metricsStr}`;
      }
      
      const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
      return `[${timestamp}] [${level.toUpperCase()}] ${message} ${metaStr}`;
    })
  ),
  transports: [
    new winston.transports.Console()
  ],
});

export default logger;
