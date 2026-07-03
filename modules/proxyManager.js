// modules/proxyManager.js

/**
 * Enterprise Network Proxy Routing Controller
 */
export class ProxyManager {
  /**
   * Parses and validates raw proxy string strings
   * @param {string} hostStr - "ip:port" or "host:port"
   * @param {string} authStr - "username:password" (optional)
   */
  static parseProxyCredentials(hostStr, authStr) {
    if (!hostStr) return null;

    const hostParts = hostStr.split(':');
    const config = {
      host: hostParts[0],
      port: parseInt(hostParts[1], 10),
      username: null,
      password: null
    };

    if (authStr) {
      const authParts = authStr.split(':');
      config.username = authParts[0];
      config.password = authParts[1];
    }

    return config;
  }

  /**
   * Dispatches proxy configurations down to the Chrome System Networking Layer
   */
  static applySystemProxy(proxyConfig, callback) {
    if (!proxyConfig) return;

    const chromeConfig = {
      mode: "fixed_servers",
      rules: {
        singleProxy: {
          scheme: "http",
          host: proxyConfig.host,
          port: proxyConfig.port
        },
        bypassList: ["localhost", "127.0.0.1"]
      }
    };

    chrome.proxy.settings.set({ value: chromeConfig, scope: 'regular' }, () => {
      if (callback) callback();
    });
  }
}