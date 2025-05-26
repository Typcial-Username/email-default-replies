import * as Browser from 'webextension-polyfill'
import {
  addTextToEmailBody,
  grabEmailContent,
  observeAndInjectButton,
} from './DOMUtils'
import { closeModals } from './modals'
import { getSettings, saveSettings } from './storageUtils'
import { Settings } from '../types'

let Settings: Settings = {
  enabled: true,
}

// Get the settings from storage
getSettings().then((settings: Settings) => {
  // console.log('[Content Script] Got settings:', settings)
  Settings = settings

  if (Object.keys(Settings).length === 0) {
    Settings = {
      enabled: true,
    }

    saveSettings(Settings)
  }

  Browser.runtime
    .sendMessage({ action: 'contentScriptReady' })
    .catch((error) => {
      console.error('Failed to send message to background script:', error)
    })
})

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
  // console.log("[Content Script] Document loaded, checking 'enabled' setting.")
  // if (Settings.enabled) {
  //   console.log(
  //     '[Content Script] Enabled, sending ready message and observing.'
  //   )
  sendReadyMessage()
  observeAndInjectButton()
  // }
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

      addTextToEmailBody(text)
    }
  }
)
