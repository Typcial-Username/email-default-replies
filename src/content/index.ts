import * as Browser from "webextension-polyfill";
import { observeAndInjectButton } from "./DOMUtils";

Browser.runtime
  .sendMessage({ action: "contentScriptReady" })
  .then((response) => {
    console.log("Background script response:", response);
  })
  .catch((error) => {
    console.error("Failed to send message to background script:", error);
  });

// --- Initialization ---
observeAndInjectButton();
console.log("[Content Script] Initialized.");
