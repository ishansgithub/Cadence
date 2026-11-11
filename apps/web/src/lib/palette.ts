export type Tone = 'peach' | 'sage' | 'sky' | 'lilac' | 'butter' | 'rose'

export const tones: Tone[] = ['peach', 'sage', 'sky', 'lilac', 'butter', 'rose']

const emojis = ['📚', '🏃', '🎧', '✏️', '🌱', '🎨', '🧠', '🧘', '💻', '🎸', '🍳', '📷']

function hash(value: string) {
  let result = 0
  for (let index = 0; index < value.length; index += 1) {
    result = (result * 31 + value.charCodeAt(index)) | 0
  }
  return Math.abs(result)
}

export function toneFor(id: string | null | undefined): Tone {
  if (!id) return 'peach'
  return tones[hash(id) % tones.length]
}

export function emojiFor(id: string | null | undefined): string {
  if (!id) return '⏱️'
  return emojis[hash(`${id}:emoji`) % emojis.length]
}

export function toneClass(id: string | null | undefined) {
  return `tone-${toneFor(id)}`
}
