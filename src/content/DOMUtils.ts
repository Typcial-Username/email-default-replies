import { saveResponse } from './storageUtils'
import { createButton } from './UIComponents'

export function findEmailBody(): HTMLElement | null {
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

export function addTextToEmailBody(text: string) {
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

export function grabEmailContent(responseList: HTMLElement) {
  const emailBody = findEmailBody() as HTMLElement
  if (!emailBody) {
    alert('Email body not found!')
    return
  }

  const title = prompt('Enter the title:')
  let content = emailBody.innerText.trim() || '' // Grab plain text content

  // Improved signature patterns
  const signaturePatterns = [
    /(--|__|-\s+)[\s\S]*$/m, // Matches "--", "__", or "- " as signature markers
    /best regards[\s\S]*$/im, // Matches "Best regards" (case-insensitive)
    /kind regards[\s\S]*$/im, // Matches "Kind regards" (case-insensitive)
    /thanks(?:,?[\s\S]*)?$/im, // Matches "Thanks" or "Thanks,"
    /sincerely[\s\S]*$/im, // Matches "Sincerely"
    /sent from my .+$/im, // Matches "Sent from my iPhone/Android/etc."
    /sent via .+$/im, // Matches "Sent via..."
    /^[\s\S]*on.*wrote:$/m, // Matches quoted email indicators (e.g., "On DATE, NAME wrote:")
  ]

  // Iterate over patterns and strip everything after the first match
  for (const pattern of signaturePatterns) {
    const match = content.match(pattern)
    if (match) {
      content = content.substring(0, match.index).trim()
      break // Stop after finding the first match
    }
  }

  // Save the cleaned response
  saveResponse(title?.trim(), content, responseList)
}

export function observeAndInjectButton() {
  const observer = new MutationObserver(() => {
    if (injectButtonIfNeeded()) observer.disconnect()
  })
  observer.observe(document.body, { childList: true, subtree: true })
}

export function injectButtonIfNeeded(): boolean {
  const sendButton = document.querySelector(
    '[aria-label*="send"]'
  ) as HTMLElement
  if (sendButton && !document.getElementById('default-response-button')) {
    const button = createButton()
    button.id = 'default-response-button'
    sendButton.parentElement?.appendChild(button)
    return true
  }
  return false
}
