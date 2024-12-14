import { ResponseItem } from '../types'
import { addTextToEmailBody, grabEmailContent } from './DOMUtils'
import {
  deleteResponse,
  loadResponses,
  saveResponse,
  updateResponse,
} from './storageUtils'
import { darkenHexColor } from './UIComponents'

export function createResponseList(): HTMLDivElement {
  const responseList = document.createElement('div')
  responseList.style.cssText = `max-height: 200px; overflow-y: auto;`
  return responseList
}

export function renderResponseList(
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
        padding: 0.5rem; 
        background: #f9f9f9; 
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
        background: none;
        border: none;
        color: #1a73e8;
        cursor: pointer;
        font-size: 1rem;
      `
    responseButton.onclick = () => {
      addTextToEmailBody(response.content)
      document.getElementById('response-modal')?.remove()
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

    // Copy to Clipboard Button
    const copyButton = document.createElement('button')
    copyButton.textContent = '📋'
    copyButton.style.cssText = `
        margin-right: 0.5rem;
        padding: 0.25rem 0.5rem;
        background-color: #f1f1f1;
        border: none;
        border-radius: 0.25rem;
        cursor: pointer;
      `
    copyButton.onclick = () => {
      navigator.clipboard.writeText(response.content)
      alert('Response copied to clipboard!')
      console.log(`[Modal] Copied to clipboard: ${response.content}`)
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

    // Append elements
    row.appendChild(responseButton)
    row.appendChild(editButton)
    row.appendChild(copyButton)
    row.appendChild(deleteButton)
    responseList.appendChild(row)
  })
}

export function createModalOverlay(): HTMLDivElement {
  const overlay = document.createElement('div')
  overlay.id = 'response-modal'
  overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.5); display: flex;
      justify-content: center; align-items: center; z-index: 10000;
    `
  return overlay
}

export function createModalContainer(): HTMLDivElement {
  const container = document.createElement('div')
  container.style.cssText = `
      background: white; border-radius: 0.5rem; padding: 1rem;
      width: 25rem; box-shadow: 0 0.25rem 0.375rem rgba(0, 0, 0, 0.1);
    `
  return container
}

export function createModalTitle(text: string): HTMLHeadingElement {
  const title = document.createElement('h2')
  title.textContent = text
  title.style.marginBottom = '0.75rem'
  // Center the title
  title.style.textAlign = 'center'
  return title
}

export function createModalButton(
  text: string,
  color: string,
  onClick: () => void
): HTMLButtonElement {
  const button = document.createElement('button')
  button.textContent = text
  button.style.cssText = `
      width: 100%; margin: 0.5rem 0; padding: 0.5rem;
      background-color: ${color}; color: white;
      border: none; border-radius: 0.25rem; cursor: pointer;
    `
  button.onmouseover = () =>
    (button.style.backgroundColor = darkenHexColor(color, 10))
  button.onmouseleave = () => (button.style.backgroundColor = color)
  button.onclick = onClick
  return button
}

export async function openResponseModal() {
  const modalOverlay = createModalOverlay()
  const modalContainer = createModalContainer()
  const responseList = createResponseList()

  const refreshButton = createModalButton('🔄 Refresh', '#1a73e8', () => {
    refreshButton.style.backgroundColor = '#1a73e8'
    loadResponses().then((responses) => {
      renderResponseList(responseList, responses)
    })
  })

  const responses = await loadResponses()
  renderResponseList(responseList, responses)

  // Create horizzontal div to hold buttons
  const buttonContainer = document.createElement('div')
  buttonContainer.style.cssText = `display: flex; justify-content: space-between;`

  const grabButton = createModalButton(
    'Grab From Email Content',
    '#2196f3',
    () => grabEmailContent(responseList)
  )
  const manualButton = createModalButton(
    'Add Response Manually',
    '#4caf50',
    () => openManualResponseModal(responseList)
  )

  buttonContainer.append(grabButton, manualButton)

  const closeButton = createModalButton('Close', '#e53935', () =>
    modalOverlay.remove()
  )

  modalContainer.append(
    createModalTitle('Manage Responses'),
    refreshButton,
    responseList,
    buttonContainer,
    closeButton
  )

  modalOverlay.appendChild(modalContainer)
  document.body.appendChild(modalOverlay)
  renderResponseList(responseList, responses)
}

export function openManualResponseModal(responseList: HTMLElement) {
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
      border-radius: 0.5rem;
      box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.2);
      width: 25rem;
      max-width: 90%;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    `

  // Title input
  const titleInput = document.createElement('input')
  titleInput.type = 'text'
  titleInput.placeholder = 'Enter title (optional)'
  titleInput.style.cssText = `
      width: 100%;
      padding: 0.5rem;
      font-size: 1rem;
      border: 1px solid #ccc;
      border-radius: 0.25rem;
    `

  // Response textarea
  const responseTextarea = document.createElement('textarea')
  responseTextarea.placeholder = 'Enter your custom response here...'
  responseTextarea.style.cssText = `
      width: 100%;
      height: 7.5rem; /* 120px */
      padding: 0.5rem; /* 8px */
      font-size: 0.875rem; /* 14px */
      border: 1px solid #ccc;
      border-radius: 0.25rem; /* 4px */
      resize: vertical;
    `

  // Buttons container
  const buttonsContainer = document.createElement('div')
  buttonsContainer.style.cssText = `
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem; /* 8px */
    `

  // Cancel button
  const cancelButton = document.createElement('button')
  cancelButton.textContent = 'Cancel'
  cancelButton.style.cssText = `
      padding: 0.5rem 0.75rem;
      background-color: #e53935;
      color: white;
      border: none;
      border-radius: 0.25rem;
      cursor: pointer;
    `
  cancelButton.onclick = () => modalOverlay.remove()

  // Save button
  const saveButton = document.createElement('button')
  saveButton.textContent = 'Save'
  saveButton.style.cssText = `
      padding: 0.5rem 0.75rem;
      background-color: #1a73e8;
      color: white;
      border: none;
      border-radius: 0.25rem;
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

export function openEditModal(response: ResponseItem) {
  const modalOverlay = createModalOverlay()
  const modalContainer = createModalContainer()

  // Title input
  const titleInput = document.createElement('input')
  titleInput.type = 'text'
  titleInput.value = response.title || ''
  titleInput.style.cssText = `
      width: 100%;
      padding: 0.5rem;
      margin-bottom: 0.625rem;
      border: 1px solid #ccc;
      border-radius: 0.25rem;
    `

  // Content textarea
  const contentInput = document.createElement('textarea')
  contentInput.value = response.content
  contentInput.style.cssText = `
      width: 100%;
      padding: 0.5rem;
      min-height: 6.25rem; /* 100px */
      margin-bottom: 0.625rem; /* 10px */
      border: 1px solid #ccc;
      border-radius: 0.25rem; /* 4px */
      resize: vertical;
    `

  // Save button
  const saveButton = createModalButton('Save', '#1a73e8', () => {
    const title = titleInput.value.trim()
    const content = contentInput.value.trim()

    if (content) {
      updateResponse(response, { title: title || undefined, content })
      modalOverlay.remove()
    } else {
      alert('Response content cannot be empty.')
    }
  })

  // Close button
  const closeButton = createModalButton('Close', '#e53935', () =>
    modalOverlay.remove()
  )

  // Append elements to modal container
  modalContainer.append(
    createModalTitle('Edit Response'),
    titleInput,
    contentInput,
    saveButton,
    closeButton
  )

  modalOverlay.appendChild(modalContainer)
  document.body.appendChild(modalOverlay)
}
