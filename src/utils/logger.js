// Production-ready logging utility
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

export const logger = {
  // Only log errors in production
  error: (...args) => {
    console.error(...args);
  },
  
  // Only log warnings in production for critical issues
  warn: (...args) => {
    console.warn(...args);
  },
  
  // Development only logs
  info: (...args) => {
    if (IS_DEVELOPMENT) {
      console.log(...args);
    }
  },
  
  // Development only logs
  debug: (...args) => {
    if (IS_DEVELOPMENT) {
      console.log('[DEBUG]', ...args);
    }
  },
  
  // API requests - minimal in production
  api: (method, url, data) => {
    if (IS_DEVELOPMENT) {
      console.log(`🔄 ${method} Request: ${url}`, data || '');
    }
  },
  
  // API success - minimal in production
  apiSuccess: (method, url, result) => {
    if (IS_DEVELOPMENT) {
      console.log(`✅ ${method} Success: ${url}`, result);
    }
  },
  
  // API errors - always log but minimal in production
  apiError: (method, url, error) => {
    if (IS_PRODUCTION) {
      console.error(`API Error: ${method} ${url}`);
    } else {
      console.error(`❌ ${method} Failure (${url}):`, error);
    }
  }
};

export default logger;
