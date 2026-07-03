// modules/proxyManager.js

export class ProxyManager {
  static async request(url, options = {}) {
    return fetch(url, options);
  }
}