import { browser } from "webextension-polyfill";

console.log("Hello from content.ts");

// Function to create the Default Response button
function createButton(): HTMLButtonElement {
  const defaultResponseButton = document.createElement("button");
  defaultResponseButton.textContent = "Default Response";
  defaultResponseButton.style.backgroundColor = "blue";
  defaultResponseButton.style.color = "white";
  defaultResponseButton.style.padding = "10px";
  defaultResponseButton.style.border = "none";
  defaultResponseButton.style.borderRadius = "5px";
  defaultResponseButton.style.cursor = "pointer";
  defaultResponseButton.style.margin = "10px";
  defaultResponseButton.style.zIndex = "1000";
  defaultResponseButton.id = "default-response-button";

  defaultResponseButton.onclick = () => {
    console.log("Default Response button clicked!");
    addTextToEmailBody("This is a default response.");
  };

  return defaultResponseButton;
}

// Function to locate the "Send" button on the page
function findSendButton(): HTMLElement | null {
  // Find all elements with role="button" or <button> tags
  const buttonCandidates = Array.from(
    document.querySelectorAll('[role="button"], button, input[type="submit"]')
  );

  // Filter for elements with "Send" in their aria-label or text content
  const sendButton = buttonCandidates.find((element) => {
    const ariaLabel = element.getAttribute("aria-label")?.toLowerCase();
    const textContent = element.textContent?.toLowerCase();

    return (
      (ariaLabel && ariaLabel.includes("send")) ||
      (textContent && textContent.includes("send"))
    );
  });

  if (sendButton) {
    console.log("Send button found:", sendButton);
    return sendButton as HTMLElement;
  }

  console.log("Send button not found.");
  return null;
}

// Function to add text to the Gmail email body
function addTextToEmailBody(text: string) {
  // Locate the email body using the aria-label, role, and contenteditable attributes
  const emailBody = document.querySelector(
    "div[aria-label='Message Body'][role='textbox'][contenteditable='true']"
  ) as HTMLElement | null;

  if (emailBody) {
    console.log("Email body found:", emailBody);

    // Focus the editable area to make it active
    emailBody.focus();

    // Use Selection and Range API to insert text
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0) || document.createRange();

    // Place the cursor at the end of the content if no selection exists
    if (!selection?.rangeCount) {
      range.selectNodeContents(emailBody);
      range.collapse(false); // Collapse to the end of the range
      selection?.removeAllRanges();
      selection?.addRange(range);
    }

    // Insert the text
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);

    // Move the cursor after the inserted text
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    selection?.removeAllRanges();
    selection?.addRange(range);

    console.log("Text added to email body:", text);
  } else {
    console.log("Email body not found.");
  }
}

// Function to observe dynamic content changes
function observeDynamicContent() {
  console.log(
    "[Content Script] Starting MutationObserver to watch for dynamic content..."
  );

  const observer = new MutationObserver(() => {
    const success = addDefaultResponseButton();
    if (success) {
      console.log(
        "[Content Script] Default Response button added. Disconnecting observer..."
      );
      observer.disconnect(); // Stop observing after successful addition
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
  console.log("[Content Script] MutationObserver started.");
}

// Function to add the Default Response button
function addDefaultResponseButton(): boolean {
  console.log("[Content Script] Looking for Send button...");

  const sendButton = findSendButton();

  if (sendButton) {
    // Check if the Default Response button already exists
    if (!document.getElementById("default-response-button")) {
      console.log(
        "[Content Script] Send button found. Adding Default Response button..."
      );

      const responseButton = createButton();
      sendButton.parentElement?.appendChild(responseButton);

      return true;
    } else {
      console.log(
        "[Content Script] Default Response button already exists. Skipping."
      );
    }
  } else {
    console.log("[Content Script] Send button not found.");
  }
  return false;
}

// Listen for a message from the background script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "injectButton") {
    console.log("Received message to inject button.");
    const success = addDefaultResponseButton();
    sendResponse({
      status: success ? "Button add success" : "Button add failure",
    });
  }
});
