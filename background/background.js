// // background/background.js

// const PIPELINE_ACTIONS = {
//   START_AUTOMATION: 'START_AUTOMATION',
//   LOG_MESSAGE: 'LOG_MESSAGE',
//   EXECUTION_COMPLETE: 'EXECUTION_COMPLETE'
// };

// // Telemetry logging to popup
// function sendTelemetryLog(message, logType = 'system') {
//   chrome.runtime.sendMessage({
//     action: PIPELINE_ACTIONS.LOG_MESSAGE,
//     text: message,
//     logType: logType
//   }).catch(() => {});
// }

// // 🌐 100% DYNAMIC & SAFE PROXY TUNNEL CONTROLLER
// function applyNetworkProxy(host, port, username, password) {
//   if (!host || host.trim() === "") {
//     chrome.proxy.settings.clear({ scope: 'regular' }, () => {
//       sendTelemetryLog(`Running on Direct Local Network (No Proxy Overhead).`, "system");
//     });
//     return;
//   }

//   const cleanPort = parseInt(port, 10) || 80;
//   const config = {
//     mode: "fixed_servers",
//     rules: {
//       singleProxy: { scheme: "http", host: host.trim(), port: cleanPort },
//       bypassList: ["localhost", "127.0.0.1"]
//     }
//   };

//   chrome.proxy.settings.set({ value: config, scope: 'regular' }, () => {
//     sendTelemetryLog(`Proxy Tunnel Active on: ${host.trim()}:${cleanPort}`, "success");
//   });

//   // Dynamic Auth credentials registration
//   // Purane authenticated listeners ko clear karne ke liye handler handle karega
//   chrome.webRequest.onAuthRequired.removeListener(provideCredentialsHandler);

//   if (username && username.trim() !== "") {
//     chrome.webRequest.onAuthRequired.addListener(
//       provideCredentialsHandler,
//       { urls: ["<all_urls>"] },
//       ["blocking"]
//     );
//   }

//   function provideCredentialsHandler() {
//     return { 
//       authCredentials: { 
//         username: username.trim(), 
//         password: (password || "").trim() 
//       } 
//     };
//   }
// }

// // ACTION ROUTER INTERCEPTOR (With Live Handshakes for API & Proxy Tests)
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
//   // 1. Launch Button Implementation
//   if (request.action === PIPELINE_ACTIONS.START_AUTOMATION) {
//     const { urls, leadData, config } = request.payload;
    
//     chrome.storage.local.set({ 
//       'active_lead_data': leadData,
//       'pipeline_step': 'SEARCHING_CONTACT',
//       'captcha_api_key': config?.captchaKey || ''
//     }, () => {
//       sendTelemetryLog(`Initializing secure sockets and pipelines...`);
//       applyNetworkProxy(config?.proxyHost, config?.proxyPort, config?.proxyUsername, config?.proxyPassword);
      
//       if (urls && urls.length > 0 && urls[0].trim() !== "") {
//         let targetUrl = urls[0].trim();
//         if (!targetUrl.startsWith('http')) {
//           targetUrl = 'https://' + targetUrl;
//         }
//         chrome.tabs.create({ url: targetUrl, active: true });
//       } else {
//         sendTelemetryLog(`Error: Target URL list was empty!`, "error");
//       }
//     });
//   }
  
//   // 2. Real-Time 2Captcha Verification Test Node
//   if (request.action === "TEST_CAPTCHA_API") {
//     fetch(`https://2captcha.com/res.php?key=${request.key}&action=getbalance`)
//       .then(res => res.text())
//       .then(text => {
//         if (text.includes("ERROR") || text.toLowerCase().includes("bad")) {
//           sendResponse({ success: false, error: text });
//         } else {
//           sendResponse({ success: true, balance: text });
//         }
//       })
//       .catch(err => sendResponse({ success: false, error: err.message }));
//     return true; // Keep channel open for async fetch
//   }

//   // 3. Dynamic Live Proxy Verification Node
//   if (request.action === "TEST_PROXY_CONNECTION") {
//     const { host, port, username, password } = request.proxy;
    
//     // Test karne ke liye pehle settings apply karo
//     applyNetworkProxy(host, port, username, password);

//     // Kuch millisecond ka timeout taaki settings lag jaye, fir network access test karo
//     setTimeout(() => {
//       fetch("https://httpbin.org/ip")
//         .then(res => {
//           if (res.ok) sendResponse({ success: true });
//           else sendResponse({ success: false, error: `Server response code: ${res.status}` });
//         })
//         .catch(err => {
//           sendResponse({ success: false, error: "Connection Failed. Proxy might be offline or dead." });
//         });
//     }, 500);
//     return true; 
//   }
  
//   if (request.action === "FORCE_REDIRECT_URL") {
//     chrome.storage.local.set({ 'pipeline_step': 'FILLING_FORM' }, () => {
//       sendTelemetryLog(`Navigating dynamically to: ${request.url}`);
//       chrome.tabs.update(sender.tab.id, { url: request.url });
//     });
//   }
// });

// // DOM RENDERING MONITOR PIPELINE
// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//   if (changeInfo.status === 'complete' && tab.url) {
//     chrome.storage.local.get(['active_lead_data', 'pipeline_step'], (result) => {
//       if (result.active_lead_data) {
//         const step = result.pipeline_step || 'SEARCHING_CONTACT';
//         setTimeout(() => {
//           chrome.tabs.sendMessage(tabId, {
//             action: "PROCESS_PAGE_STAGE",
//             stage: step,
//             payload: result.active_lead_data
//           }, (response) => {
//             if (chrome.runtime.lastError) return;
//             if (response && response.status) {
//               sendTelemetryLog(response.status, response.success ? "success" : "warning");
//             }
//           });
//         }, 2000);
//       }
//     });
//   }
// });

// background.js
const PIPELINE_ACTIONS = {
  START_AUTOMATION: 'START_AUTOMATION',
  LOG_MESSAGE: 'LOG_MESSAGE',
  EXECUTION_COMPLETE: 'EXECUTION_COMPLETE'
};

const automationSessions = new Map();

function createSession(tabId, leadData) {
  automationSessions.set(tabId, {
    tabId,
    leadData,
    stage: "SEARCHING_CONTACT",
    startedAt: Date.now()
  });
}

function getSession(tabId) {
  return automationSessions.get(tabId);
}

function updateSession(tabId, updates) {
  const session = automationSessions.get(tabId);
  if (!session) return;
  automationSessions.set(tabId, { ...session, ...updates });
}

function deleteSession(tabId) {
  automationSessions.delete(tabId);
}

function sendTelemetryLog(message, logType = 'system') {
  chrome.runtime.sendMessage({
    action: PIPELINE_ACTIONS.LOG_MESSAGE,
    text: message,
    logType: logType
  }).catch(() => {});
}

function applyNetworkProxy(host, port, username, password) {
  if (!host || host.trim() === "") {
    chrome.proxy.settings.clear({ scope: 'regular' }, () => {
      sendTelemetryLog(`Running on Direct Local Network.`, "system");
    });
    return;
  }
  const cleanPort = parseInt(port, 10) || 80;
  const config = {
    mode: "fixed_servers",
    rules: {
      singleProxy: { scheme: "http", host: host.trim(), port: cleanPort },
      bypassList: ["localhost", "127.0.0.1"]
    }
  };
  chrome.proxy.settings.set({ value: config, scope: 'regular' }, () => {
    sendTelemetryLog(`Proxy Tunnel Active on: ${host.trim()}:${cleanPort}`, "success");
  });

  chrome.webRequest.onAuthRequired.removeListener(provideCredentialsHandler);
  if (username && username.trim() !== "") {
    chrome.webRequest.onAuthRequired.addListener(
      provideCredentialsHandler,
      { urls: ["<all_urls>"] },
      ["blocking"]
    );
  }
  function provideCredentialsHandler() {
    return { authCredentials: { username: username.trim(), password: (password || "").trim() } };
  }
}

// ACTION ROUTER
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === PIPELINE_ACTIONS.START_AUTOMATION) {
    const { urls, leadData, config } = request.payload;
    sendTelemetryLog("Initializing secure sockets and pipelines...");
    applyNetworkProxy(config?.proxyHost, config?.proxyPort, config?.proxyUsername, config?.proxyPassword);

    if (!urls || urls.length === 0) {
      sendTelemetryLog("Target URL list empty!", "error");
      return;
    }

    urls.forEach(rawUrl => {
      if (!rawUrl || rawUrl.trim() === "") return;
      let targetUrl = rawUrl.trim();
      if (!targetUrl.startsWith("http")) targetUrl = "https://" + targetUrl;

      chrome.tabs.create({ url: targetUrl, active: false }, (tab) => {
        if (chrome.runtime.lastError || !tab) return;
        createSession(tab.id, leadData);
        sendTelemetryLog(`[TAB ${tab.id}] Automation Started Parallelly`, "success");
      });
    });
  }

  if (request.action === "TEST_CAPTCHA_API") {
    fetch(`https://2captcha.com/res.php?key=${request.key}&action=getbalance`)
      .then(res => res.text())
      .then(text => {
        if (text.includes("ERROR") || text.toLowerCase().includes("bad")) sendResponse({ success: false, error: text });
        else sendResponse({ success: true, balance: text });
      }).catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (request.action === "TEST_PROXY_CONNECTION") {
    const { host, port, username, password } = request.proxy;
    applyNetworkProxy(host, port, username, password);
    setTimeout(() => {
      fetch("https://httpbin.org/ip")
        .then(res => {
          if (res.ok) sendResponse({ success: true });
          else sendResponse({ success: false, error: `Server response code: ${res.status}` });
        }).catch(() => sendResponse({ success: false, error: "Connection Failed." }));
    }, 500);
    return true;
  }

  if (request.action === "UPDATE_STAGE") {
    updateSession(sender.tab.id, { stage: request.stage });
    sendResponse({ success: true });
    return true;
  }

  if (request.action === "FORCE_REDIRECT_URL") {
    updateSession(sender.tab.id, { stage: "FILLING_FORM" });
    sendTelemetryLog(`[TAB ${sender.tab.id}] Redirecting -> ${request.url}`);
    chrome.tabs.update(sender.tab.id, { url: request.url });
    sendResponse({ success: true });
    return true;
  }

  // 🔥 FIXED: Separate Tab Handler for Calendly Links
  if (request.action === "OPEN_NEW_TAB_URL") {
    const parentSession = getSession(sender.tab.id);
    sendTelemetryLog(`[TAB ${sender.tab.id}] Opening Calendly in separate tab -> ${request.url}`, "system");
    
    chrome.tabs.create({ url: request.url, active: true }, (newTab) => {
      if (chrome.runtime.lastError || !newTab) return;
      
      // Parent tab ka leadData naye tab ki session mapping mein daal do
      if (parentSession) {
        createSession(newTab.id, parentSession.leadData);
        updateSession(newTab.id, { stage: "FILLING_FORM" });
      } else {
        createSession(newTab.id, request.payload || {});
        updateSession(newTab.id, { stage: "FILLING_FORM" });
      }
    });
    sendResponse({ success: true });
    return true;
  }

  if (request.action === "AUTOMATION_COMPLETE_SUCCESS") {
    sendTelemetryLog(`[TAB ${sender.tab.id}] Automation Finished`, "success");
  }
});

// DYNAMIC INTERCEPTOR
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete") return;

  let session = getSession(tabId);

  if (!session && tab.url && tab.url.includes("calendly.com")) {
    for (let [id, activeSess] of automationSessions.entries()) {
      if (id !== tabId && activeSess.stage === "FILLING_FORM") {
        createSession(tabId, activeSess.leadData);
        session = getSession(tabId);
        updateSession(tabId, { stage: "FILLING_FORM" });
        break;
      }
    }
  }

  if (!session || !tab.url) return;

  if (tab.url.includes("calendly.com") && session.stage !== "FILLING_FORM") {
    updateSession(tabId, { stage: "FILLING_FORM" });
    session.stage = "FILLING_FORM";
  }

  setTimeout(() => {
    chrome.tabs.sendMessage(tabId, {
      action: "PROCESS_PAGE_STAGE",
      stage: session.stage,
      payload: session.leadData
    }, (response) => {
      if (chrome.runtime.lastError || !response) return;
      sendTelemetryLog(`[TAB ${tabId}] ${response.status}`, response.success ? "success" : "warning");
    });
  }, 1500);
});

chrome.tabs.onRemoved.addListener((tabId) => { if (automationSessions.has(tabId)) deleteSession(tabId); });
chrome.runtime.onStartup.addListener(() => { automationSessions.clear(); });
chrome.runtime.onInstalled.addListener(() => { automationSessions.clear(); });