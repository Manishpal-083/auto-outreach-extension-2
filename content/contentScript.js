// content/contentScript.js

console.log("[Outreach Engine] Dual-Engine Orchestrator Active.");

window.schedulerButtonClicked = false;
window.calendlyObserverRunning = false;
window.calendlyIframeWatcherRunning = false;
window.calendlyFormFilled = false;
window.dateClicked = false;
window.observerActive = false;
window.globalLeadData = null;
window.filledElements = new WeakSet();

window.resetAutomation = function() {
    window.schedulerButtonClicked = false;
    window.calendlyObserverRunning = false;
    window.calendlyIframeWatcherRunning = false;
    window.calendlyFormFilled = false;
    window.dateClicked = false;
    sessionStorage.removeItem("redirectedURL");
    window.globalLeadData = null;
    window.filledElements = new WeakSet();
    console.log("[Outreach Engine] Automation state reset.");
};

async function initializeOrchestrator() {
    try {
        const messageHandlerUrl = chrome.runtime.getURL("modules/messageHandler.js");
        const msgMod = await import(messageHandlerUrl);
        msgMod.MessageHandler.init();
        console.log("[Outreach Engine] MessageHandler module initialized dynamically.");
    } catch (e) {
        console.error("[Outreach Engine] Failed to load MessageHandler: ", e);
    }
}

// Start orchestration
initializeOrchestrator();