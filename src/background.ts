import * as Browser from 'webextension-polyfill'
import type { InjectButtonMessage, InjectButtonResponse } from './types'
import clients from './clients.json'

function getHostname(url: string): string {
  const { hostname } = new URL(url)
  return hostname
}

Browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.id) {
    // Skip if the tab is a Chrome page or not in the clients list
    if (
      tab.url.startsWith('chrome://') ||
      tab.url.startsWith('about:') ||
      !clients.includes(getHostname(tab.url))
    ) {
      return
    }

    try {
      // Inject content script dynamically
      const results = await Browser.scripting.executeScript({
        target: { tabId },
        files: ['dist/content.js'],
      })

      if (!results || results.length === 0) {
        throw new Error('Content script injection failed.')
      }

      // Wait for content script readiness
      const readyListener = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Content script readiness timeout'))
        }, 5000) // Timeout after 5 seconds

        const listener = (
          message: unknown,
          sender: Browser.Runtime.MessageSender
        ): true | undefined => {
          // Type guard to check if message is of type { action: string }
          if (
            typeof message === 'object' &&
            message !== null &&
            'action' in message &&
            typeof (message as any).action === 'string'
          ) {
            const { action } = message as { action: string }
            if (action === 'contentScriptReady' && sender.tab?.id === tabId) {
              console.log('[Background Script] Content script ready.')
              Browser.runtime.onMessage.removeListener(listener)
              clearTimeout(timeout)
              resolve()

              return true
            }
          }
        }

        Browser.runtime.onMessage.addListener(listener)
      })

      await readyListener

      // Send message to inject button after content script confirms readiness
      const response = (await Browser.tabs.sendMessage(tabId, {
        action: 'injectButton',
      } as InjectButtonMessage)) as InjectButtonResponse
    } catch (error: any) {
      if (error.message.includes('context invalidated')) {
        console.warn(
          '[Background Script] Extension context invalidated, reloading...'
        )
        Browser.runtime.reload()
      } else {
        console.error(`[Background Script] Error: ${error.message || error}`)
      }
    }
  }
})

Browser.runtime.onMessage.addListener(
  (
    message: unknown,
    sender: Browser.Runtime.MessageSender,
    sendResponse: (response: unknown) => void
  ): true | undefined => {
    if (!sender.tab) {
      return
    }

    if (
      typeof message === 'object' &&
      message !== null &&
      'action' in message &&
      typeof (message as any).action === 'string'
    ) {
      const { action } = message as { action: string }

      if (action === 'injectButton') {
        sendResponse({ status: 'injected' })
        return true // Allow async sendResponse handling
      } else if (action == 'contentScriptReady') {
        sendResponse({ status: 'ready' })
        return true
      }

      console.warn(`[Background Script] Unknown action: ${action}`)
    }

    return true
  }
)
