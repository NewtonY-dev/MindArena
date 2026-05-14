const originalConsole = {
  log: console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console)
};

const levels = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 100
};

const getLevel = () => {
  const requested = (process.env.LOG_LEVEL || '').toLowerCase();
  if (levels[requested] !== undefined) {
    return requested;
  }

  return 'error';
};

const shouldLog = (level) => levels[level] >= levels[getLevel()];

const format = (args) => args.map((arg) => {
  if (arg instanceof Error) {
    return arg.stack || arg.message;
  }

  if (typeof arg === 'object' && arg !== null) {
    try {
      return JSON.stringify(arg);
    } catch {
      return String(arg);
    }
  }

  return String(arg);
}).join(' ');

const logger = {
  debug: (...args) => {
    if (shouldLog('debug')) {
      originalConsole.log(format(args));
    }
  },
  info: (...args) => {
    if (shouldLog('info')) {
      originalConsole.log(format(args));
    }
  },
  warn: (...args) => {
    if (shouldLog('warn')) {
      originalConsole.warn(format(args));
    }
  },
  error: (...args) => {
    if (shouldLog('error')) {
      originalConsole.error(format(args));
    }
  },
  startup: (...args) => {
    originalConsole.log(format(args));
  }
};

globalThis.appLogger = logger;

console.log = (...args) => logger.debug(...args);
console.info = (...args) => logger.info(...args);
console.warn = (...args) => logger.warn(...args);
console.error = (...args) => logger.error(...args);

export default logger;
