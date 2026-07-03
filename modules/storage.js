// modules/storage.js

export class StorageManager {
  static getSessionItem(key) {
    return sessionStorage.getItem(key);
  }

  static setSessionItem(key, value) {
    sessionStorage.setItem(key, value);
  }

  static removeSessionItem(key) {
    sessionStorage.removeItem(key);
  }
}