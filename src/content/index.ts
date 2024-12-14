import * as Browser from 'webextension-polyfill'
import { observeAndInjectButton } from './DOMUtils'

// Wait for the DOM to be fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.self !== window.top) {
      return
    }
    sendReadyMessage()
    observeAndInjectButton()
  })
} else {
  sendReadyMessage()
  observeAndInjectButton()
}

function sendReadyMessage() {
  Browser.runtime
    .sendMessage({ action: 'contentScriptReady' })
    .catch((error) => {
      console.error('Failed to send message to background script:', error)
    })
}
