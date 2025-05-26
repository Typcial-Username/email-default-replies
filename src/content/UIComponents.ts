import { openResponseModal } from './modals'

export function createButton(): HTMLElement {
  // Create container without shadow DOM
  const container = document.createElement('div')
  const shadow = container.attachShadow({ mode: 'closed' })

  // Add style reset in shadow DOM
  const style = document.createElement('style')
  style.textContent = `
    :host {
      all: initial;
      display: inline-block;
    }
    button {
      all: initial;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      background-color: #1a73e8;
      color: white;
      padding: 0.5rem 0.75rem;
      border: none;
      border-radius: 0.25rem;
      font-size: 0.875rem;
      font-weight: bold;
      cursor: pointer;
      margin-left: 0.5rem;
      transition: background-color 0.2s ease;
      text-align: center;
      white-space: nowrap;
      min-width: 7.5rem;
      display: inline-block;
      line-height: 1.2;
    }
    button:hover, button:focus {
      background-color: #174ea6;
    }
  `

  shadow.appendChild(style)

  const button = document.createElement('button')
  button.textContent = '✨ Default Response'
  button.addEventListener('click', () => openResponseModal())

  shadow.appendChild(button)

  return container
}

export function darkenHexColor(hex: string, percent: number): string {
  // Ensure the hex code is valid
  if (!/^#?[0-9A-Fa-f]{6}$/.test(hex)) {
    throw new Error('Invalid hex color format. Use #RRGGBB.')
  }

  // Remove the '#' if present
  const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex

  // Parse RGB values
  const r = parseInt(cleanHex.substring(0, 2), 16)
  const g = parseInt(cleanHex.substring(2, 4), 16)
  const b = parseInt(cleanHex.substring(4, 6), 16)

  // Calculate the factor to darken the color
  const factor = 1 - percent / 100

  // Darken each component and clamp between 0 and 255
  const darken = (value: number) =>
    Math.max(0, Math.min(255, Math.floor(value * factor)))

  const newR = darken(r)
  const newG = darken(g)
  const newB = darken(b)

  // Convert back to hex and return
  return `#${newR.toString(16).padStart(2, '0')}${newG
    .toString(16)
    .padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`
}
