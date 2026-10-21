const PRODUCT_TONES = [
  { className: 'matrix-product-coral', color: '#ff7a59' },
  { className: 'matrix-product-chartreuse', color: '#d6ff4b' },
  { className: 'matrix-product-lilac', color: '#b58cff' },
  { className: 'matrix-product-pink', color: '#ff8fd8' },
  { className: 'matrix-product-amber', color: '#ffc857' },
  { className: 'matrix-product-mint', color: '#7de2d1' },
  { className: 'matrix-product-periwinkle', color: '#a8b8ff' },
  { className: 'matrix-product-orchid', color: '#f2a7ff' },
] as const;

function toneIndex(code: string) {
  return Array.from(code.trim().toUpperCase()).reduce((total, character) => total + character.charCodeAt(0), 0) % PRODUCT_TONES.length;
}

export function productToneForCode(code: string) {
  return PRODUCT_TONES[toneIndex(code)].className;
}

export function productColorForCode(code: string) {
  return PRODUCT_TONES[toneIndex(code)].color;
}
