import * as Browser from 'webextension-polyfill'
import { renderResponseList } from './modals'
import { ResponseItem, StorageData } from '../types'

const isStorageAvailable = Browser.storage?.sync || Browser.storage.local
const storage = isStorageAvailable
  ? (Browser.storage?.sync ?? Browser.storage.local)
  : null

const STORAGE_KEY = 'customResponses'

const DEFAULT_RESPONSES: ResponseItem[] = [
  {
    title: 'Reach Out',
    content: "Thank you for reaching out. I'll get back to you shortly!",
  },
  {
    title: 'Connect',
    content: 'Looking forward to connecting with you further.',
  },
]

// Function to safely access storage
async function safeStorageAccess<T>(
  action: () => Promise<T>
): Promise<T | undefined> {
  try {
    if (!storage) throw new Error('Storage API is not available.')
    return await action()
  } catch (error) {
    console.error('Storage access error:', error)
    return undefined
  }
}

export function loadResponses(): Promise<ResponseItem[]> {
  return new Promise((resolve, reject) => {
    safeStorageAccess(() => storage!.get(STORAGE_KEY)).then(
      (data: StorageData | undefined) => {
        resolve(data?.customResponses || DEFAULT_RESPONSES)
      }
    )
    // storage.get('customResponses').then((data: StorageData) => {
    //   resolve(data.customResponses || DEFAULT_RESPONSES)
    // })
  })
}

export function saveResponse(
  title: string | undefined,
  newResponse: string,
  responseList: HTMLElement
) {
  safeStorageAccess(() => storage!.get(STORAGE_KEY)).then(
    (data: StorageData | undefined) => {
      const responses: ResponseItem[] = data?.customResponses || []
      responses.push({ title, content: newResponse })

      safeStorageAccess(() =>
        storage!.set({ customResponses: responses })
      ).then(() => {
        renderResponseList(responseList, responses)
      })
    }
  )
}

// --- Update and Delete Functions
// Update a response item in the list
export function updateResponse(
  response: ResponseItem,
  newResponse: ResponseItem
) {
  safeStorageAccess(() => storage!.get(STORAGE_KEY)).then(
    (data: StorageData | undefined) => {
      const responses = data?.customResponses || []

      // Find the index of the response
      const index = responses.findIndex(
        (item) =>
          item.title === response.title && item.content === response.content
      )

      if (index === -1) {
        console.error('Failed to update response: Response not found.')
        return
      }

      // Update and save
      responses[index] = newResponse
      safeStorageAccess(() =>
        storage!.set({ customResponses: responses })
      ).then(() => {
        console.log('Response updated:', newResponse)
        const responseList = document.getElementById('response-list')
        if (responseList) renderResponseList(responseList, responses)
      })
    }
  )
}

export function deleteResponse(index: number, responseList: HTMLElement) {
  safeStorageAccess(() => storage!.get('customResponses')).then(
    (data: StorageData | undefined) => {
      const responses = data?.customResponses || []
      responses.splice(index, 1)

      safeStorageAccess(() =>
        storage!.set({ customResponses: responses })
      ).then(() => {
        renderResponseList(responseList, responses)
      })
    }
  )
}
