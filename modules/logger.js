// modules/logger.js
export class AppLogger {
  static log(message, type = 'system') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    chrome.runtime.sendMessage({
      action: 'LOG_MESSAGE',
      message: message,
      logType: type
    }).catch(() => {});
  }
}