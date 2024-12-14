import * as Browser from "webextension-polyfill";
import { renderResponseList } from "./modals";
import { ResponseItem, StorageData } from "../types";

const storage = Browser.storage?.sync ?? Browser.storage.local;

const DEFAULT_RESPONSES: ResponseItem[] = [
  { content: "Thank you for reaching out. I'll get back to you shortly!" },
  { content: "Looking forward to connecting with you further." },
];

export function loadResponses(): Promise<ResponseItem[]> {
  return new Promise((resolve, reject) => {
    storage.get("customResponses").then((data: StorageData) => {
      resolve(data.customResponses || DEFAULT_RESPONSES);
    });
  });
}

export function saveResponse(
  title: string | undefined,
  newResponse: string,
  responseList: HTMLElement
) {
  storage.get("customResponses").then((data: StorageData) => {
    const responses: ResponseItem[] = data.customResponses || [];
    responses.push({ title, content: newResponse });
    storage.set({ customResponses: responses }).then(() => {
      renderResponseList(responseList, responses);
    });
  });
}

// --- Update and Delete Functions
// Update a response item in the list
export function updateResponse(
  response: ResponseItem,
  newResponse: ResponseItem
) {
  storage.get("customResponses").then((data: StorageData) => {
    const responses = data.customResponses || [];

    // Find the index of the response by comparing content
    const index = responses.findIndex(
      (item) =>
        item.title === response.title && item.content === response.content
    );

    if (index == -1) {
      console.error("Failed to update response: Response not found.");
    }

    // Update the response at the found index
    responses[index] = newResponse;

    // Save updated responses back to storage
    storage.set({ customResponses: responses }).then(() => {
      console.log("Response updated:", newResponse);
      // Optionally re-render the list
      const responseList = document.getElementById("response-list");
      if (responseList) renderResponseList(responseList, responses);
    });
  });
}

export function deleteResponse(index: number, responseList: HTMLElement) {
  storage.get("customResponses").then((data: StorageData) => {
    const responses = data.customResponses || [];
    responses.splice(index, 1);
    Browser.storage.sync.set({ customResponses: responses }).then(() => {
      renderResponseList(responseList, responses);
    });
  });
}
