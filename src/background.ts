import { browser } from "webextension-polyfill";
console.log("[Background Script] Hello from background.ts");

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log("[Background Script] Tab updated:", tabId, tab.url);
  if (changeInfo.status === "complete" && tab.url) {
    const hostname = new URL(tab.url).hostname;

    console.log(`[Background Script] Tab updated. URL: ${hostname}`);

    chrome.tabs.sendMessage(tabId, { action: "injectButton" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error(
          `[Background Script] Error: ${chrome.runtime.lastError.message}`
        );
      } else {
        console.log(
          `[Background Script] Response: ${response?.status || "No response"}`
        );
      }
    });
  }
});
