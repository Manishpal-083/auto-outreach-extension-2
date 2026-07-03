// modules/logger.js

export class Logger {
  static log(message, ...args) {
    console.log(`[Outreach Engine] ${message}`, ...args);
  }
  static warn(message, ...args) {
    console.warn(`[Outreach Engine] ${message}`, ...args);
  }
  static error(message, ...args) {
    console.error(`[Outreach Engine] ${message}`, ...args);
  }
  static info(message, ...args) {
    console.info(`[Outreach Engine] ${message}`, ...args);
  }
}