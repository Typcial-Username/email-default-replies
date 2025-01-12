import * as Browser from 'webextension-polyfill'

import {
  deleteResponse,
  getSettings,
  loadResponses,
} from '../content/storageUtils'
import { openEditModal, openManualResponseModal } from '../content/modals'
import { ResponseItem, Settings } from '../types'
import { darkenHexColor } from '../content/UIComponents'

const responseList = document.getElementById('response-list') as HTMLDivElement

const settings: Settings = {
  enabled: true,
}

console.log('[Popup Script] Popup script loaded.')

// Load responses from storage
await loadResponses().then((responses) => {
  if (responseList) {
    renderResponseList(responseList, responses)
  }
})

await getSettings().then((data: Settings) => {
  if (data) {
    settings.enabled = data.enabled
    enableToggle.checked = settings.enabled
  }
})

// const grabEmailButton = document.getElementById(
//   'grab-email'
// ) as HTMLButtonElement
const manualResponseButton = document.getElementById(
  'manual-response'
) as HTMLButtonElement
const closeButton = document.getElementById(
  'close-ext-menu'
) as HTMLButtonElement
const enableToggle = document.getElementById(
  'enable-toggle'
) as HTMLInputElement

if (
  !responseList ||
  // !grabEmailButton ||
  !closeButton ||
  !manualResponseButton
) {
  let errorMessage = '[Popup Script] Element not found: '
  if (!responseList) errorMessage += 'responseList, '
  // if (!grabEmailButton) errorMessage += 'grabEmailButton, '
  if (!manualResponseButton) errorMessage += 'manualResponseButton, '
  if (!closeButton) errorMessage += 'closeButton, '

  throw new Error(errorMessage)
}

enableToggle.addEventListener('change', (event: Event) => {
  event.preventDefault()
  console.log({ event })
  console.log('[Popup Script] Toggling extension...')

  if (enableToggle.checked) {
    let stateText = document.getElementsByClassName(
      'state-text'
    )[0] as HTMLSpanElement

    stateText.textContent = 'ON'
  } else {
    let stateText = document.getElementsByClassName(
      'state-text'
    )[0] as HTMLSpanElement

    stateText.textContent = 'OFF'
  }
})

// grabEmailButton.addEventListener('click', () => {
//   console.log('[Popup Script] Requesting email content...')

//   setTimeout(() => {
//     console.log('[Popup Script] Timeout reached.')
//   }, 50)

//   Browser.runtime.sendMessage({ action: 'grabEmailContent', responseList })
// })

manualResponseButton.addEventListener('click', () => {
  openManualResponseModal(responseList)
})

closeButton.addEventListener('click', () => {
  window.close()
})

function renderResponseList(
  responseList: HTMLDivElement,
  responces: ResponseItem[]
) {
  responces.forEach((response, index) => {
    const row = document.createElement('div')
    row.style.cssText = `
            display: flex; 
            align-items: center; 
            justify-content: space-between; 
            padding: 0.5rem; 
            background: #FCF5E5; 
            border-radius: 0.25rem; 
            margin-bottom: 0.375rem;
          `

    // Response Button (title or trimmed content)
    const responseButton = document.createElement('button')
    responseButton.textContent = response.title || 'Untitled Response' // Fallback to "Untitled Response"
    responseButton.title = response.content // Tooltip with full content
    responseButton.style.cssText = `
            flex: 1;
            text-align: left;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            background: transparent;
            border: none;
            color: #1a73e8;
            cursor: pointer;
            font-size: 1rem;
            margin: 0.25rem 0.5rem;
          `
    responseButton.onclick = () => {
      console.log('[Popup Script] Requesting response to add to email body...')
      // Browser.runtime.sendMessage({
      //   action: 'addTextToEmailBody',
      //   text: response.content,
      // })
    }

    responseButton.onmouseover = () => {
      responseButton.style.textDecoration = 'underline'
    }

    responseButton.onmouseleave = () => {
      responseButton.style.textDecoration = 'none'
    }

    // Edit Button
    const editButton = document.createElement('button')
    editButton.textContent = '✏️'
    editButton.style.cssText = `
            margin-right: 0.5rem;
            padding: 0.25rem 0.5rem;
            background-color: #f1f1f1;
            border: none;
            border-radius: 0.25rem;
            cursor: pointer;
          `

    editButton.onclick = () => {
      openEditModal(response)
    }

    editButton.onmouseover = () => {
      editButton.style.backgroundColor = darkenHexColor('#f1f1f1', 10)
    }

    editButton.onmouseleave = () => {
      editButton.style.backgroundColor = '#f1f1f1'
    }

    // Copy to Clipboard Button
    const copyButton = document.createElement('button')
    copyButton.textContent = '📋'
    copyButton.style.cssText = `
            margin-right: 0.5rem;
            padding: 0.25rem 0.5rem;
            background-color: #d8d8d8;
            border: none;
            border-radius: 0.25rem;
            cursor: pointer;
          `
    copyButton.onclick = () => {
      navigator.clipboard.writeText(response.content)
      alert('Response copied to clipboard!')
    }

    copyButton.onmouseover = () => {
      copyButton.style.backgroundColor = darkenHexColor('#d8d8d8', 10)
    }

    copyButton.onmouseleave = () => {
      copyButton.style.backgroundColor = '#d8d8d8'
    }

    // Trash/Delete Button
    const deleteButton = document.createElement('button')
    deleteButton.textContent = '🗑️'
    deleteButton.style.cssText = `
            background-color: #e53935;
            color: white;
            border: none;
            border-radius: 0.25rem;
            cursor: pointer;
            padding: 0.25rem 0.5rem;
          `
    deleteButton.onclick = () => deleteResponse(index, responseList)

    deleteButton.onmouseover = () => {
      deleteButton.style.backgroundColor = darkenHexColor('#e53935', 10)
    }

    deleteButton.onmouseleave = () => {
      deleteButton.style.backgroundColor = '#e53935'
    }

    // Append elements
    row.appendChild(responseButton)
    row.appendChild(editButton)
    row.appendChild(copyButton)
    row.appendChild(deleteButton)
    responseList.appendChild(row)
  })
}

// Browser.runtime.onMessage.addListener(
//   (
//     message: unknown,
//     sender: Browser.Runtime.MessageSender,
//     sendResponse: (response: unknown) => void
//   ): true | undefined => {
//     if (!sender.tab) return

//     if (
//       typeof message === 'object' &&
//       message !== null &&
//       'emailBody' in message &&
//       typeof (message as any).emailBody === 'string'
//     ) {
//       const { emailBody } = message as { emailBody: string }

//       console.log('[Popup Script] Received email body:', emailBody)

//       return true
//     }
//   }
// )
