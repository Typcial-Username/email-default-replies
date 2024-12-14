import { openResponseModal } from './modals'

export function createButton(): HTMLButtonElement {
  const button = document.createElement('button')
  button.textContent = '✨ Default Response'
  styleButton(button)
  addButtonEventListeners(button)
  return button
}

function styleButton(button: HTMLButtonElement) {
  button.style.cssText = `
      background-color: #1a73e8;
      color: white;
      padding: 0.5rem 0.75rem;
      border: none;
      border-radius: 0.25rem;
      font-size: 1rem;
      font-weight: bold;
      cursor: pointer;
      margin-left: 0.5rem;
      transition: background-color 0.2s ease, transform 0.1s ease;
      box-shadow: none;
      appearance: none;
      outline: none;
      position: relative;
    `
}

function addButtonEventListeners(button: HTMLButtonElement) {
  button.onmouseover = () => {
    button.style.backgroundColor = '#174ea6'
    button.style.boxShadow = 'none'
  }
  button.onmouseleave = () => {
    button.style.backgroundColor = '#1a73e8'
    button.style.boxShadow = 'none'
  }
  button.onfocus = () => {
    button.style.backgroundColor = '#174ea6'
    button.style.outline = 'none'
  }
  button.onblur = () => {
    button.style.backgroundColor = '#1a73e8'
  }
  button.onclick = () => openResponseModal()
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

  console.log(
    `Made ${hex} ${percent}% darker: #${newR
      .toString(16)
      .padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB
      .toString(16)
      .padStart(2, '0')}`
  )

  // Convert back to hex and return
  return `#${newR.toString(16).padStart(2, '0')}${newG
    .toString(16)
    .padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`
}
