import { ref, watch } from 'vue'
import type { Ref } from 'vue'

/** 阅读器设置持久化键 */
const KEYS = {
  theme: 'reader_theme',
  fontSize: 'reader_fontsize',
  lineHeight: 'reader_lineheight',
  shelf: '51nova_bookshelf',
}

export function useReaderSettings() {
  const theme = ref(localStorage.getItem(KEYS.theme) || 'dark')
  const fontSize = ref(Number(localStorage.getItem(KEYS.fontSize)) || 18)
  const lineHeight = ref(Number(localStorage.getItem(KEYS.lineHeight)) || 2)

  function changeFontSize(delta: number) {
    fontSize.value = Math.max(12, Math.min(32, fontSize.value + delta))
  }
  function changeLineHeight(delta: number) {
    lineHeight.value = Math.max(1.2, Math.min(3.5, +(lineHeight.value + delta).toFixed(1)))
  }

  // 持久化
  watch(theme, v => localStorage.setItem(KEYS.theme, v))
  watch(fontSize, v => localStorage.setItem(KEYS.fontSize, String(v)))
  watch(lineHeight, v => localStorage.setItem(KEYS.lineHeight, String(v)))

  return { theme, fontSize, lineHeight, changeFontSize, changeLineHeight }
}

/** 书架管理 */
export function useShelf() {
  function getShelf(): number[] {
    return JSON.parse(localStorage.getItem(KEYS.shelf) || '[]')
  }
  function toggleFavorite(novelId: number): boolean {
    const shelf = getShelf()
    const idx = shelf.indexOf(novelId)
    if (idx >= 0) { shelf.splice(idx, 1); localStorage.setItem(KEYS.shelf, JSON.stringify(shelf)); return false }
    shelf.push(novelId); localStorage.setItem(KEYS.shelf, JSON.stringify(shelf)); return true
  }
  function isFavorited(novelId: number): boolean {
    return getShelf().includes(novelId)
  }
  return { getShelf, toggleFavorite, isFavorited }
}

/** 阅读进度管理 */
export function useProgress(novelId: Ref<number>) {
  const progressKey = `reader_progress_${novelId.value}`

  function saveProgress(chapterIndex: number) {
    localStorage.setItem(progressKey, String(chapterIndex))
  }
  function loadProgress(): number {
    return Number(localStorage.getItem(progressKey)) || 0
  }
  return { saveProgress, loadProgress }
}
