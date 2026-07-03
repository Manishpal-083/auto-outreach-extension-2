// // popup.js
// document.addEventListener('DOMContentLoaded', async () => {
//   const PIPELINE_ACTIONS = {
//     START_AUTOMATION: 'START_AUTOMATION',
//     UPDATE_STATUS: 'UPDATE_STATUS',
//     LOG_MESSAGE: 'LOG_MESSAGE',
//     EXECUTION_COMPLETE: 'EXECUTION_COMPLETE'
//   };

//   const btn = document.getElementById("themeToggle");


//   if (localStorage.getItem("theme") === "dark") {
//     document.body.classList.add("dark");
//     btn.textContent = "☀️";
//   }

//   btn.onclick = () => {
//     document.body.classList.toggle("dark");

//     const dark = document.body.classList.contains("dark");

//     localStorage.setItem("theme", dark ? "dark" : "light");

//     btn.textContent = dark ? "☀️" : "🌙";
//   };


//   const resetBtn = document.getElementById("resetBtn");

//   resetBtn.addEventListener("click", () => {

//     if (!confirm("Reset all saved data?")) {
//       return;
//     }

//     chrome.storage.local.clear(() => {

//       localStorage.removeItem("theme");

//       sessionStorage.clear();

//       document.querySelectorAll("input").forEach(input => {
//         input.value = "";
//       });

//       document.querySelectorAll("textarea").forEach(area => {
//         area.value = "";
//       });

//       const logPanel = document.querySelector(".log-panel");

//       if (logPanel) {
//         logPanel.innerHTML =
//           '<div class="log-line system">System reset successfully.</div>';
//       }

//       alert("All saved data has been cleared.");

//     });

//   });

//   const STORAGE_KEYS = { USER_SETTINGS: 'outreach_engine_settings' };

//   const elements = {
//     urls: document.getElementById('targetUrls'),
//     name: document.getElementById('leadName'),
//     email: document.getElementById('leadEmail'),
//     message: document.getElementById('leadMessage'),
//     captcha: document.getElementById('captchaKey'),
//     proxyHost: document.getElementById('proxyHost'),
//     proxyAuth: document.getElementById('proxyAuth'),
//     btn: document.getElementById('executeBtn'),
//     status: document.getElementById('engineStatus'),
//     console: document.getElementById('logConsole')
//   };

//   chrome.storage.local.get([STORAGE_KEYS.USER_SETTINGS], (result) => {
//     if (result[STORAGE_KEYS.USER_SETTINGS]) {
//       const data = result[STORAGE_KEYS.USER_SETTINGS];
//       elements.name.value = data.name || '';
//       elements.email.value = data.email || '';
//       elements.message.value = data.message || '';
//       elements.captcha.value = data.captcha || '';
//       elements.proxyHost.value = data.proxyHost || '';
//       elements.proxyAuth.value = data.proxyAuth || '';
//     }
//   });

//   function appendLog(message, type = 'system') {
//     const logLine = document.createElement('div');
//     logLine.className = `log-line ${type}`;
//     logLine.innerText = `[${new Date().toLocaleTimeString()}] ${message}`;
//     elements.console.appendChild(logLine);
//     elements.console.scrollTop = elements.console.scrollHeight;
//   }

//   elements.btn.addEventListener('click', () => {
//     const rawUrls = elements.urls.value.trim().split('\n').filter(url => url.trim() !== '');
//     if (rawUrls.length === 0) {
//       appendLog('Error: No target URLs provided.', 'error');
//       return;
//     }

//     const payload = {
//       urls: rawUrls,
//       leadData: { name: elements.name.value.trim(), email: elements.email.value.trim(), message: elements.message.value.trim() },
//       config: { captchaKey: elements.captcha.value.trim(), proxyHost: elements.proxyHost.value.trim(), proxyAuth: elements.proxyAuth.value.trim() }
//     };

//     chrome.storage.local.set({ [STORAGE_KEYS.USER_SETTINGS]: { ...payload.leadData, ...payload.config } });
//     elements.status.innerText = 'Processing';
//     appendLog('Dispatched orchestrator script pipeline. Opening sockets...');

//     chrome.runtime.sendMessage({ action: PIPELINE_ACTIONS.START_AUTOMATION, data: payload });
//   });

//   chrome.runtime.onMessage.addListener((request) => {
//     if (request.action === PIPELINE_ACTIONS.LOG_MESSAGE) appendLog(request.message, request.logType || 'system');
//     if (request.action === PIPELINE_ACTIONS.EXECUTION_COMPLETE) {
//       elements.status.innerText = 'Ready';
//       appendLog('Pipeline Execution finalized successfully.', 'success');
//     }
//   });
// });




// popup/popup.js

// DOM ELEMENTS CONFIGURATION
// const ELEMENTS = {
//   engineStatus: document.getElementById('engineStatus'),
//   themeToggle: document.getElementById('themeToggle'),
//   targetUrls: document.getElementById('targetUrls'),
//   leadName: document.getElementById('leadName'),
//   leadEmail: document.getElementById('leadEmail'),
//   leadMessage: document.getElementById('leadMessage'),
//   captchaKey: document.getElementById('captchaKey'),
//   proxyHost: document.getElementById('proxyHost'),
//   proxyPort: document.getElementById('proxyPort'),
//   proxyUsername: document.getElementById('proxyUsername'),
//   proxyPassword: document.getElementById('proxyPassword'),
//   testApiBtn: document.getElementById('testApiBtn'),
//   testProxyBtn: document.getElementById('testProxyBtn'),
//   executeBtn: document.getElementById('executeBtn'),
//   resetBtn: document.getElementById('resetBtn'),
//   logConsole: document.getElementById('logConsole')
// };

// // INITIALIZATION ENTRY POINT
// document.addEventListener('DOMContentLoaded', () => {
//   init();
// });

// function init() {
//   loadTheme();
//   loadSettings();
//   listeners();
// }

// // 🌐 THEME ENGINE
// function loadTheme() {
//   chrome.storage.local.get(['theme'], (result) => {
//     const currentTheme = result.theme || 'dark';
//     document.body.setAttribute('data-theme', currentTheme);
//     ELEMENTS.themeToggle.textContent = currentTheme === 'dark' ? '🌙' : '☀️';
//   });
// }

// function toggleTheme() {
//   const currentTheme = document.body.getAttribute('data-theme') || 'dark';
//   const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
//   document.body.setAttribute('data-theme', newTheme);
//   ELEMENTS.themeToggle.textContent = newTheme === 'dark' ? '🌙' : '☀️';
  
//   chrome.storage.local.set({ theme: newTheme });
//   appendLog('system', `Theme changed to ${newTheme} mode.`);
// }

// // 💾 STORAGE ENGINE (Load & Auto-Save)
// function loadSettings() {
//   chrome.storage.local.get([
//     'targetUrls', 'leadName', 'leadEmail', 'leadMessage',
//     'captchaKey', 'proxyHost', 'proxyPort', 'proxyUsername', 'proxyPassword'
//   ], (items) => {
//     if (items.targetUrls) ELEMENTS.targetUrls.value = items.targetUrls;
//     if (items.leadName) ELEMENTS.leadName.value = items.leadName;
//     if (items.leadEmail) ELEMENTS.leadEmail.value = items.leadEmail;
//     if (items.leadMessage) ELEMENTS.leadMessage.value = items.leadMessage;
//     if (items.captchaKey) ELEMENTS.captchaKey.value = items.captchaKey;
//     if (items.proxyHost) ELEMENTS.proxyHost.value = items.proxyHost;
//     if (items.proxyPort) ELEMENTS.proxyPort.value = items.proxyPort;
//     if (items.proxyUsername) ELEMENTS.proxyUsername.value = items.proxyUsername;
//     if (items.proxyPassword) ELEMENTS.proxyPassword.value = items.proxyPassword;
    
//     appendLog('system', 'Saved configurations pulled from local state.');
//   });
// }

// function saveSettings() {
//   const settingsData = {
//     targetUrls: ELEMENTS.targetUrls.value,
//     leadName: ELEMENTS.leadName.value,
//     leadEmail: ELEMENTS.leadEmail.value,
//     leadMessage: ELEMENTS.leadMessage.value,
//     captchaKey: ELEMENTS.captchaKey.value,
//     proxyHost: ELEMENTS.proxyHost.value,
//     proxyPort: ELEMENTS.proxyPort.value,
//     proxyUsername: ELEMENTS.proxyUsername.value,
//     proxyPassword: ELEMENTS.proxyPassword.value
//   };

//   chrome.storage.local.set(settingsData, () => {
//     console.log("[Outreach Engine] Storage synced.");
//   });
// }

// // 🗑️ RESET PIPELINE
// function resetData() {
//   const confirmClear = confirm("Are you sure you want to clear all data and reset the system state?");
//   if (!confirmClear) return;

//   chrome.storage.local.clear(() => {
//     localStorage.clear();
//     sessionStorage.clear();

//     // Clear UI Fields
//     Object.keys(ELEMENTS).forEach(key => {
//       if (ELEMENTS[key] && (ELEMENTS[key].tagName === 'INPUT' || ELEMENTS[key].tagName === 'TEXTAREA')) {
//         ELEMENTS[key].value = '';
//       }
//     });

//     ELEMENTS.logConsole.innerHTML = '';
//     updateStatus('READY');
//     appendLog('system', 'System database purged. Status reset to READY.');
//     alert("Data reset successfully!");
//     loadTheme(); // Restore default theme safely
//   });
// }

// // 🛡️ VALIDATION LAYER
// function validateInputs() {
//   if (!ELEMENTS.targetUrls.value.trim()) throw new Error("Target Websites list cannot be empty.");
//   if (!ELEMENTS.leadName.value.trim()) throw new Error("Outreach Lead Name is required.");
//   if (!ELEMENTS.leadEmail.value.trim()) throw new Error("Outreach Lead Email is required.");
  
//   const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//   if (!emailPattern.test(ELEMENTS.leadEmail.value.trim())) {
//     throw new Error("Please enter a valid Lead Email Address.");
//   }
// }

// // 📦 PAYLOAD BUILDER
// function buildPayload() {
//   const rawUrls = ELEMENTS.targetUrls.value.split('\n');
//   const sanitizedUrls = rawUrls
//     .map(url => url.trim())
//     .filter(url => url.length > 0 && (url.startsWith('http://') || url.startsWith('https://')));

//   if (sanitizedUrls.length === 0) {
//     throw new Error("No valid HTTP/HTTPS URLs detected in targets.");
//   }

//   return {
//     urls: sanitizedUrls,
//     leadData: {
//       name: ELEMENTS.leadName.value.trim(),
//       email: ELEMENTS.leadEmail.value.trim(),
//       message: ELEMENTS.leadMessage.value.trim()
//     },
//     config: {
//       captchaKey: ELEMENTS.captchaKey.value.trim(),
//       proxyHost: ELEMENTS.proxyHost.value.trim(),
//       proxyPort: ELEMENTS.proxyPort.value.trim(),
//       proxyUsername: ELEMENTS.proxyUsername.value.trim(),
//       proxyPassword: ELEMENTS.proxyPassword.value.trim()
//     }
//   };
// }

// // 🚀 LAUNCH ENGINE CONTROL
// function launchAutomation() {
//   try {
//     validateInputs();
//     saveSettings(); // Ensure last-second saves are committed
//     const payload = buildPayload();

//     updateStatus('RUNNING');
//     appendLog('system', `Launching automation sequence across ${payload.urls.length} targets.`);

//     chrome.runtime.sendMessage({
//       action: "START_AUTOMATION",
//       payload: payload
//     }, (response) => {
//       if (chrome.runtime.lastError) {
//         appendLog('error', `Runtime boundary failure: ${chrome.runtime.lastError.message}`);
//         updateStatus('ERROR');
//         return;
//       }
//       appendLog('system', 'Automation stack successfully deployed to background processor.');
//     });

//   } catch (error) {
//     appendLog('error', `Validation aborted: ${error.message}`);
//     alert(error.message);
//   }
// }

// // 🔑 CAPTCHA VALIDATION ENGINE
// function testApi() {
//   const apiKey = ELEMENTS.captchaKey.value.trim();
//   if (!apiKey) {
//     appendLog('error', 'API verification canceled: Key field is blank.');
//     alert("Please enter a 2Captcha API Key to perform this test.");
//     return;
//   }

//   appendLog('system', 'Pinging API server node...');
  
//   chrome.runtime.sendMessage({
//     action: "TEST_CAPTCHA_API",
//     key: apiKey
//   }, (response) => {
//     if (response && response.success) {
//       appendLog('success', `API Key authentic. Balance fetched: ${response.balance}`);
//     } else {
//       const errMsg = response ? response.error : 'Connection timed out.';
//       appendLog('error', `API Authentication failed: ${errMsg}`);
//     }
//   });
// }

// // 🌐 PROXY VALIDATION ENGINE
// function testProxy() {
//   const proxyData = {
//     host: ELEMENTS.proxyHost.value.trim(),
//     port: ELEMENTS.proxyPort.value.trim(),
//     username: ELEMENTS.proxyUsername.value.trim(),
//     password: ELEMENTS.proxyPassword.value.trim()
//   };

//   if (!proxyData.host || !proxyData.port) {
//     appendLog('error', 'Proxy verification canceled: Host/Port structural fields missing.');
//     alert("Host and Port are strictly required to test proxy configuration.");
//     return;
//   }

//   appendLog('system', `Injecting proxy rules: ${proxyData.host}:${proxyData.port}...`);

//   chrome.runtime.sendMessage({
//     action: "TEST_PROXY_CONNECTION",
//     proxy: proxyData
//   }, (response) => {
//     if (response && response.success) {
//       appendLog('success', 'Proxy handshake established successfully. Tunnel active.');
//     } else {
//       const errMsg = response ? response.error : 'Gateway handshake timeout.';
//       appendLog('error', `Proxy node rejected configuration: ${errMsg}`);
//     }
//   });
// }

// // 📜 LOG & CONSOLE GRAPHICS UTILS
// function appendLog(type, text) {
//   const logLine = document.createElement('div');
//   logLine.className = `log-line ${type}`;
  
//   const timestamp = new Date().toLocaleTimeString();
//   logLine.textContent = `[${timestamp}] [${type.toUpperCase()}] ${text}`;
  
//   ELEMENTS.logConsole.appendChild(logLine);
//   ELEMENTS.logConsole.scrollTop = ELEMENTS.logConsole.scrollHeight;
// }

// function updateStatus(statusText) {
//   ELEMENTS.engineStatus.textContent = statusText;
//   ELEMENTS.engineStatus.className = `status-badge ${statusText.toLowerCase()}`;
// }

// // 🎙️ LISTENERS / EVENT MANAGER
// function listeners() {
//   // Theme Click Action
//   ELEMENTS.themeToggle.addEventListener('click', toggleTheme);

//   // Structural Action Triggers
//   ELEMENTS.resetBtn.addEventListener('click', resetData);
//   ELEMENTS.testApiBtn.addEventListener('click', testApi);
//   ELEMENTS.testProxyBtn.addEventListener('click', testProxy);
//   ELEMENTS.executeBtn.addEventListener('click', launchAutomation);

//   // Keyup Auto Save Bindings
//   const interactiveInputs = [
//     ELEMENTS.targetUrls, ELEMENTS.leadName, ELEMENTS.leadEmail, 
//     ELEMENTS.leadMessage, ELEMENTS.captchaKey, ELEMENTS.proxyHost, 
//     ELEMENTS.proxyPort, ELEMENTS.proxyUsername, ELEMENTS.proxyPassword
//   ];

//   interactiveInputs.forEach(inputElement => {
//     inputElement.addEventListener('keyup', saveSettings);
//   });

//   // Background Live Logging Sync Socket
//   chrome.runtime.onMessage.addListener((message) => {
//     if (message.action === "LOG_MESSAGE") {
//       appendLog(message.logType || 'system', message.text);
//     } else if (message.action === "UPDATE_STATUS") {
//       updateStatus(message.status);
//     }
//   });
// }












// DOM ELEMENTS CONFIGURATION
const ELEMENTS = {
  engineStatus: document.getElementById('engineStatus'),
  themeToggle: document.getElementById('themeToggle'),
  targetUrls: document.getElementById('targetUrls'),
  leadName: document.getElementById('leadName'),
  leadEmail: document.getElementById('leadEmail'),
  leadMessage: document.getElementById('leadMessage'),
  captchaKey: document.getElementById('captchaKey'),
  proxyHost: document.getElementById('proxyHost'),
  proxyPort: document.getElementById('proxyPort'),
  proxyUsername: document.getElementById('proxyUsername'),
  proxyPassword: document.getElementById('proxyPassword'),
  testApiBtn: document.getElementById('testApiBtn'),
  testProxyBtn: document.getElementById('testProxyBtn'),
  executeBtn: document.getElementById('executeBtn'),
  resetBtn: document.getElementById('resetBtn'),
  logConsole: document.getElementById('logConsole')
};

// INITIALIZATION ENTRY POINT
document.addEventListener('DOMContentLoaded', () => {
  init();
});

function init() {
  loadTheme();
  loadSettings();
  listeners();
}

// 🌐 THEME ENGINE
function loadTheme() {
  chrome.storage.local.get(['theme'], (result) => {
    const currentTheme = result.theme || 'dark';
    document.body.setAttribute('data-theme', currentTheme);
    ELEMENTS.themeToggle.textContent = currentTheme === 'dark' ? '🌙' : '☀️';
  });
}

function toggleTheme() {
  const currentTheme = document.body.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.body.setAttribute('data-theme', newTheme);
  ELEMENTS.themeToggle.textContent = newTheme === 'dark' ? '🌙' : '☀️';
  
  chrome.storage.local.set({ theme: newTheme });
  appendLog('system', `Theme changed to ${newTheme} mode.`);
}

// 💾 STORAGE ENGINE (Load & Auto-Save)
function loadSettings() {
  chrome.storage.local.get([
    'targetUrls', 'leadName', 'leadEmail', 'leadMessage',
    'captchaKey', 'proxyHost', 'proxyPort', 'proxyUsername', 'proxyPassword'
  ], (items) => {
    if (items.targetUrls) ELEMENTS.targetUrls.value = items.targetUrls;
    if (items.leadName) ELEMENTS.leadName.value = items.leadName;
    if (items.leadEmail) ELEMENTS.leadEmail.value = items.leadEmail;
    if (items.leadMessage) ELEMENTS.leadMessage.value = items.leadMessage;
    if (items.captchaKey) ELEMENTS.captchaKey.value = items.captchaKey;
    if (items.proxyHost) ELEMENTS.proxyHost.value = items.proxyHost;
    if (items.proxyPort) ELEMENTS.proxyPort.value = items.proxyPort;
    if (items.proxyUsername) ELEMENTS.proxyUsername.value = items.proxyUsername;
    if (items.proxyPassword) ELEMENTS.proxyPassword.value = items.proxyPassword;
    
    appendLog('system', 'Saved configurations pulled from local state.');
  });
}

function saveSettings() {
  const settingsData = {
    targetUrls: ELEMENTS.targetUrls.value,
    leadName: ELEMENTS.leadName.value,
    leadEmail: ELEMENTS.leadEmail.value,
    leadMessage: ELEMENTS.leadMessage.value,
    captchaKey: ELEMENTS.captchaKey.value,
    proxyHost: ELEMENTS.proxyHost.value,
    proxyPort: ELEMENTS.proxyPort.value,
    proxyUsername: ELEMENTS.proxyUsername.value,
    proxyPassword: ELEMENTS.proxyPassword.value
  };

  chrome.storage.local.set(settingsData, () => {
    console.log("[Outreach Engine] Storage synced.");
  });
}

// 🗑️ RESET PIPELINE
function resetData() {
  const confirmClear = confirm("Are you sure you want to clear all data and reset the system state?");
  if (!confirmClear) return;

  chrome.storage.local.clear(() => {
    localStorage.clear();
    sessionStorage.clear();

    // Clear UI Fields
    Object.keys(ELEMENTS).forEach(key => {
      if (ELEMENTS[key] && (ELEMENTS[key].tagName === 'INPUT' || ELEMENTS[key].tagName === 'TEXTAREA')) {
        ELEMENTS[key].value = '';
      }
    });

    ELEMENTS.logConsole.innerHTML = '';
    updateStatus('READY');
    appendLog('system', 'System database purged. Status reset to READY.');
    alert("Data reset successfully!");
    loadTheme(); // Restore default theme safely
  });
}

// 🛡️ VALIDATION LAYER
function buildPayload() {

  // Har tarah ke separator support:
  // newline, comma, semicolon, spaces, tabs
  const rawUrls = ELEMENTS.targetUrls.value
    .split(/[\s,;]+/);

  const sanitizedUrls = [...new Set(
    rawUrls
      .map(url => url.trim())
      .filter(url => url.length > 0)
      .map(url => {
        if (!/^https?:\/\//i.test(url)) {
          return "https://" + url;
        }
        return url;
      })
  )];

  if (sanitizedUrls.length === 0) {
    throw new Error("No valid URLs detected.");
  }

  return {
    urls: sanitizedUrls,

    leadData: {
      name: ELEMENTS.leadName.value.trim(),
      email: ELEMENTS.leadEmail.value.trim(),
      message: ELEMENTS.leadMessage.value.trim()
    },

    config: {
      captchaKey: ELEMENTS.captchaKey.value.trim(),
      proxyHost: ELEMENTS.proxyHost.value.trim(),
      proxyPort: ELEMENTS.proxyPort.value.trim(),
      proxyUsername: ELEMENTS.proxyUsername.value.trim(),
      proxyPassword: ELEMENTS.proxyPassword.value.trim()
    }
  };
}
function validateInputs() {

    if (!ELEMENTS.targetUrls.value.trim()) {
        throw new Error("Target Websites list cannot be empty.");
    }

    if (!ELEMENTS.leadName.value.trim()) {
        throw new Error("Outreach Lead Name is required.");
    }

    if (!ELEMENTS.leadEmail.value.trim()) {
        throw new Error("Outreach Lead Email is required.");
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(ELEMENTS.leadEmail.value.trim())) {
        throw new Error("Please enter a valid Lead Email Address.");
    }

}
// 📦 PAYLOAD BUILDER

// 🚀 LAUNCH ENGINE CONTROL
function launchAutomation() {
  try {
    validateInputs();
    saveSettings(); // Ensure last-second saves are committed
    const payload = buildPayload();

    updateStatus('RUNNING');
    appendLog('system', `Launching automation sequence across ${payload.urls.length} targets.`);

    chrome.runtime.sendMessage({
      action: "START_AUTOMATION",
      payload: payload
    }, (response) => {
      if (chrome.runtime.lastError) {
        appendLog('error', `Runtime boundary failure: ${chrome.runtime.lastError.message}`);
        updateStatus('ERROR');
        return;
      }
      appendLog('system', 'Automation stack successfully deployed to background processor.');
    });

  } catch (error) {
    appendLog('error', `Validation aborted: ${error.message}`);
    alert(error.message);
  }
}

// 🔑 CAPTCHA VALIDATION ENGINE
function testApi() {
  const apiKey = ELEMENTS.captchaKey.value.trim();
  if (!apiKey) {
    appendLog('error', 'API verification canceled: Key field is blank.');
    alert("Please enter a 2Captcha API Key to perform this test.");
    return;
  }

  appendLog('system', 'Pinging API server node...');
  
  chrome.runtime.sendMessage({
    action: "TEST_CAPTCHA_API",
    key: apiKey
  }, (response) => {
    if (response && response.success) {
      appendLog('success', `API Key authentic. Balance fetched: ${response.balance}`);
    } else {
      const errMsg = response ? response.error : 'Connection timed out.';
      appendLog('error', `API Authentication failed: ${errMsg}`);
    }
  });
}

// 🌐 PROXY VALIDATION ENGINE
function testProxy() {
  const proxyData = {
    host: ELEMENTS.proxyHost.value.trim(),
    port: ELEMENTS.proxyPort.value.trim(),
    username: ELEMENTS.proxyUsername.value.trim(),
    password: ELEMENTS.proxyPassword.value.trim()
  };

  if (!proxyData.host || !proxyData.port) {
    appendLog('error', 'Proxy verification canceled: Host/Port structural fields missing.');
    alert("Host and Port are strictly required to test proxy configuration.");
    return;
  }

  appendLog('system', `Injecting proxy rules: ${proxyData.host}:${proxyData.port}...`);

  chrome.runtime.sendMessage({
    action: "TEST_PROXY_CONNECTION",
    proxy: proxyData
  }, (response) => {
    if (response && response.success) {
      appendLog('success', 'Proxy handshake established successfully. Tunnel active.');
    } else {
      const errMsg = response ? response.error : 'Gateway handshake timeout.';
      appendLog('error', `Proxy node rejected configuration: ${errMsg}`);
    }
  });
}

// 📜 LOG & CONSOLE GRAPHICS UTILS
function appendLog(type, text) {
  const logLine = document.createElement('div');
  logLine.className = `log-line ${type}`;
  
  const timestamp = new Date().toLocaleTimeString();
  logLine.textContent = `[${timestamp}] [${type.toUpperCase()}] ${text}`;
  
  ELEMENTS.logConsole.appendChild(logLine);
  ELEMENTS.logConsole.scrollTop = ELEMENTS.logConsole.scrollHeight;
}

function updateStatus(statusText) {
  ELEMENTS.engineStatus.textContent = statusText;
  ELEMENTS.engineStatus.className = `status-badge ${statusText.toLowerCase()}`;
}

// 🎙️ LISTENERS / EVENT MANAGER
function listeners() {
  // Theme Click Action
  ELEMENTS.themeToggle.addEventListener('click', toggleTheme);

  // Structural Action Triggers
  ELEMENTS.resetBtn.addEventListener('click', resetData);
  ELEMENTS.testApiBtn.addEventListener('click', testApi);
  ELEMENTS.testProxyBtn.addEventListener('click', testProxy);
  ELEMENTS.executeBtn.addEventListener('click', launchAutomation);

  // Keyup Auto Save Bindings
  const interactiveInputs = [
    ELEMENTS.targetUrls, ELEMENTS.leadName, ELEMENTS.leadEmail, 
    ELEMENTS.leadMessage, ELEMENTS.captchaKey, ELEMENTS.proxyHost, 
    ELEMENTS.proxyPort, ELEMENTS.proxyUsername, ELEMENTS.proxyPassword
  ];

  interactiveInputs.forEach(inputElement => {
    inputElement.addEventListener('keyup', saveSettings);
  });

  // Background Live Logging Sync Socket
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "LOG_MESSAGE") {
      appendLog(message.logType || 'system', message.text);
    } else if (message.action === "UPDATE_STATUS") {
      updateStatus(message.status);
    }
  });
}