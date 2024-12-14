import * as Browser from 'webextension-polyfill'
import type { StorageData, ResponseItem } from '../types'

const storage = Browser.storage?.sync ?? Browser.storage.local

const responseList = document.getElementById('response-list') as HTMLDivElement
const addResponseBtn = document.getElementById(
  'add-response'
) as HTMLButtonElement
const closeButton = document.getElementById(
  'close-ext-menu'
) as HTMLButtonElement

if (!responseList || !addResponseBtn || !closeButton) {
  throw new Error('Element not found.')
}

// Storage key
const STORAGE_KEY = 'customResponses'

// Load responses from chrome.storage.sync
function loadResponses(): void {
  storage.get(STORAGE_KEY).then((data: StorageData) => {
    const responses: ResponseItem[] = data[STORAGE_KEY] || []
    renderResponseList(responseList, responses)
  })
}

// Save responses to chrome.storage.sync
function saveResponse(
  title: string | undefined,
  newResponse: string,
  responseList: HTMLElement
) {
  storage.get('customResponses').then((data: StorageData) => {
    const responses: ResponseItem[] = data.customResponses || []
    responses.push({ title, content: newResponse })
    storage.set({ customResponses: responses }).then(() => {
      renderResponseList(responseList, responses)
    })
  })
}

function createModalButton(
  text: string,
  color: string,
  onClick: () => void
): HTMLButtonElement {
  const button = document.createElement('button')
  button.textContent = text
  button.style.cssText = `
    width: 100%; margin: 8px 0; padding: 8px;
    background-color: ${color}; color: white;
    border: none; border-radius: 4px; cursor: pointer;
  `
  button.onclick = onClick
  return button
}

function deleteResponse(index: number, responseList: HTMLElement) {
  storage.get('customResponses').then((data: StorageData) => {
    const responses = data.customResponses || []
    responses.splice(index, 1)
    Browser.storage.sync.set({ customResponses: responses }).then(() => {
      renderResponseList(responseList, responses)
    })
  })
}

function findEmailBody(): HTMLElement | null {
  // Select all contenteditable elements
  const contentEditableElements = document.querySelectorAll<HTMLElement>(
    "div[contenteditable='true']"
  )

  // Filter elements to find the correct email body
  for (const element of contentEditableElements) {
    const ariaLabel = element.getAttribute('aria-label')?.toLowerCase()

    // Check for typical labels like "message body"
    if (
      ariaLabel?.includes('message body') ||
      ariaLabel?.includes('compose') ||
      element.closest('div')?.className.includes('allowTextSelection')
    ) {
      return element // Return the email body element
    }
  }

  console.warn('[Content Script] Email body not found.')
  return null
}

function addTextToEmailBody(text: string) {
  const emailBody = findEmailBody()
  if (emailBody) {
    const formattedText = text.replace(/\n/g, '<br>') // Render new lines as <br>
    emailBody.focus()

    // Use Selection and Range API to insert text
    const selection = window.getSelection()
    const range = selection?.getRangeAt(0) || document.createRange()

    // Place the cursor at the end of the content if no selection exists
    if (!selection?.rangeCount) {
      range.selectNodeContents(emailBody)
      range.collapse(false) // Collapse to the end of the range
      selection?.removeAllRanges()
      selection?.addRange(range)
    }

    // Create a temporary container to hold the HTML content
    const tempContainer = document.createElement('div')
    tempContainer.innerHTML = formattedText

    // Insert each node (to preserve HTML structure like <br>)
    const fragment = document.createDocumentFragment()
    while (tempContainer.firstChild) {
      const child = tempContainer.firstChild
      fragment.appendChild(child)
    }

    range.deleteContents() // Replace any current selection
    range.insertNode(fragment)

    // Move the cursor to the end of the inserted content
    range.setStartAfter(emailBody.lastChild || emailBody)
    range.collapse(true)
    selection?.removeAllRanges()
    selection?.addRange(range)
  } else {
    alert('Email body not found!')
  }
}

// Render responses in the popup
function renderResponseList(
  responseList: HTMLElement,
  responses: ResponseItem[]
) {
  responseList.innerHTML = '' // Clear the list

  responses.forEach((response, index) => {
    const row = document.createElement('div')
    row.style.cssText = `
      display: flex; 
      align-items: center; 
      justify-content: space-between; 
      padding: 8px; 
      background: #f9f9f9; 
      border-radius: 4px; 
      margin-bottom: 6px;
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
      background: none;
      border: none;
      color: #1a73e8;
      cursor: pointer;
      font-size: 14px;
    `
    responseButton.onclick = () => {
      addTextToEmailBody(response.content)
      document.getElementById('response-modal')?.remove()
    }

    // Copy to Clipboard Button
    const copyButton = document.createElement('button')
    copyButton.textContent = '📋'
    copyButton.style.cssText = `
      margin-right: 8px;
      padding: 4px 8px;
      background-color: #f1f1f1;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    `
    copyButton.onclick = () => {
      navigator.clipboard.writeText(response.content)
    }

    // Trash/Delete Button
    const deleteButton = document.createElement('button')
    deleteButton.textContent = '🗑️'
    deleteButton.style.cssText = `
      background-color: #e53935;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      padding: 4px 8px;
    `
    deleteButton.onclick = () => deleteResponse(index, responseList)

    // Append elements
    row.appendChild(responseButton)
    row.appendChild(copyButton)
    row.appendChild(deleteButton)
    responseList.appendChild(row)
  })
}

// Open modal to add a manual response
function openManualResponseModal(responseList: HTMLElement) {
  // Remove any existing modal
  const existingModal = document.getElementById('manual-response-modal')
  if (existingModal) existingModal.remove()

  // Create the modal overlay
  const modalOverlay = document.createElement('div')
  modalOverlay.id = 'manual-response-modal'
  modalOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
  `

  // Create the modal container
  const modalContainer = document.createElement('div')
  modalContainer.style.cssText = `
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    width: 400px;
    max-width: 90%;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  `

  // Title input
  const titleInput = document.createElement('input')
  titleInput.type = 'text'
  titleInput.placeholder = 'Enter title (optional)'
  titleInput.style.cssText = `
    width: 100%;
    padding: 8px;
    font-size: 14px;
    border: 1px solid #ccc;
    border-radius: 4px;
  `

  // Response textarea
  const responseTextarea = document.createElement('textarea')
  responseTextarea.placeholder = 'Enter your custom response here...'
  responseTextarea.style.cssText = `
    width: 100%;
    height: 120px;
    padding: 8px;
    font-size: 14px;
    border: 1px solid #ccc;
    border-radius: 4px;
    resize: vertical;
  `

  // Buttons container
  const buttonsContainer = document.createElement('div')
  buttonsContainer.style.cssText = `
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  `

  // Cancel button
  const cancelButton = document.createElement('button')
  cancelButton.textContent = 'Cancel'
  cancelButton.style.cssText = `
    padding: 8px 12px;
    background-color: #e53935;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  `
  cancelButton.onclick = () => modalOverlay.remove()

  // Save button
  const saveButton = document.createElement('button')
  saveButton.textContent = 'Save'
  saveButton.style.cssText = `
    padding: 8px 12px;
    background-color: #1a73e8;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  `
  saveButton.onclick = () => {
    const title = titleInput.value.trim()
    const content = responseTextarea.value.trim()

    if (content) {
      saveResponse(title || undefined, content, responseList)
      modalOverlay.remove()
    } else {
      alert('Response content cannot be empty.')
    }
  }

  // Append elements to the modal
  buttonsContainer.appendChild(cancelButton)
  buttonsContainer.appendChild(saveButton)
  modalContainer.appendChild(titleInput)
  modalContainer.appendChild(responseTextarea)
  modalContainer.appendChild(buttonsContainer)
  modalOverlay.appendChild(modalContainer)
  document.body.appendChild(modalOverlay)
}

// Add event listener to the "Add Response" button
addResponseBtn.addEventListener(
  'click',
  openManualResponseModal.bind(null, responseList)
)
closeButton.addEventListener('click', () => {
  window.close()
})

// Load responses when the popup is opened
loadResponses()
