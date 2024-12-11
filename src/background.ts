import * as Browser from "webextension-polyfill";

interface InjectButtonMessage {
  action: "injectButton";
}

interface InjectButtonResponse {
  status?: string;
}

console.log("[Background Script] Hello from background.ts");

Browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    if (tab.url.startsWith("chrome://") || tab.url.startsWith("about:")) {
      console.warn(`[Background Script] Ignoring tab with URL: ${tab.url}`);
      return;
    }

    console.log(`[Background Script] Tab updated: ${tab.url}`);

    try {
      // Inject content script dynamically
      const results = await Browser.scripting
        .executeScript({
          target: { tabId },
          files: ["dist/content.js"],
        })
        .catch((error) => {
          console.error(
            `[Background Script] Failed to inject content script: ${
              error.message || error
            }`
          );
          throw error;
        });

      if (!results || results.length === 0) {
        throw new Error("Content script injection failed.");
      }

      console.log("[Background Script] Content script injected successfully.");

      // Wait for content script to initialize and send message
      const response = (await Browser.tabs.sendMessage(tabId, {
        action: "injectButton",
      } as InjectButtonMessage)) as InjectButtonResponse;

      console.log(
        `[Background Script] Response: ${response.status || "No response"}`
      );
    } catch (error: Error | any) {
      if (error.message.includes("context invalidated")) {
        console.warn(
          "[Background Script] Extension context invalidated, reloading..."
        );
        Browser.runtime.reload(); // Reload extension to reset the context
      } else {
        console.error(`[Background Script] Error: ${error.message || error}`);
      }
    }
  }
});

Browser.runtime.onMessage.addListener(
  (message: unknown, sender: Browser.Runtime.MessageSender, sendResponse) => {
    if (!sender.tab) {
      console.warn([
        "[Background Script] Ignoring message from unknown sender:",
        sender,
      ]);
      return;
    }

    try {
      const { action } = message as InjectButtonMessage;
      if (action === "injectButton") {
        console.log("[Background Script] Injecting button...");
        sendResponse({ status: "injected" });
      } else {
        console.warn(`[Background Script] Unknown action: ${action}`);
      }
    } catch (error: Error | any) {
      console.error(
        `[Background Script] Failed to process message: ${
          error.message || error
        }`
      );
    }

    return true; // Ensure the listener returns a valid type
  }
);
