// modules/storage.js
export class StorageManager {
  static async save(key, data) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: data }, () => resolve(true));
    });
  }

  static async get(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => resolve(result[key] || null));
    });
  }
}