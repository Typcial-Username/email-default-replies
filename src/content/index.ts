import * as Browser from 'webextension-polyfill'
import {
  addTextToEmailBody,
  grabEmailContent,
  observeAndInjectButton,
} from './DOMUtils'
import { closeModals } from './modals'

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

document.addEventListener('click', (event) => {
  const target = event.target as HTMLElement
  const responseModal = document.getElementById(
    'response-modal'
  ) as HTMLDivElement

  if (responseModal && !responseModal.contains(target)) {
    closeModals()
  }
})

function sendReadyMessage() {
  Browser.runtime
    .sendMessage({ action: 'contentScriptReady' })
    .catch((error) => {
      console.error('Failed to send message to background script:', error)
    })
}

Browser.runtime.onMessage.addListener(
  (
    message: unknown,
    sender: Browser.Runtime.MessageSender,
    sendResponse: (response: unknown) => void
  ): true | undefined => {
    if (!sender.tab) return
    if (typeof message !== 'object' || message == null) return

    if ('action' in message && typeof (message as any).action === 'string') {
      const { action, responseList } = message as {
        action: string
        responseList: HTMLElement
      }

      if (action === 'grabEmailContent') {
        console.log("[Content Script] Recieved 'grabEmailContent' message.")
        grabEmailContent(responseList)
        sendResponse({ status: 'success' })
      }
    } else if (
      'addTextToEmailBody' in message &&
      typeof (message as any).addTextToEmailBody === 'string'
    ) {
      const { addTextToEmailBody: text } = message as {
        addTextToEmailBody: string
      }

      console.log('[Content Script] Received addTextToEmailBody message:', text)
      addTextToEmailBody(text)
    }
  }
)
