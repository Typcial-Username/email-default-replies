// --- Interfaces ---
interface ResponseItem {
  title?: string // Optional button title
  content: string // Actual response text
}

interface StorageData {
  customResponses?: ResponseItem[]
}

interface InjectButtonMessage {
  action: 'injectButton'
}

interface InjectButtonResponse {
  status?: string
}

interface Settings {
  enabled: boolean
}

export {
  ResponseItem,
  StorageData,
  InjectButtonMessage,
  InjectButtonResponse,
  Settings,
}
