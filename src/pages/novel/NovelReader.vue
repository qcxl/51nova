<template>
  <div class="reader-page" :class="`theme-${theme}`">
    <!-- 顶部栏 -->
    <header class="reader-topbar" v-if="showTopbar">
      <button class="topbar-btn" @click="goBack">← 返回</button>
      <h1 class="topbar-title">{{ novel?.title }}</h1>
      <div class="topbar-actions">
        <button class="topbar-btn" @click="showChapterList = !showChapterList">📖</button>
        <button class="topbar-btn" @click="showSettings = !showSettings">⚙️</button>
      </div>
    </header>

    <!-- 阅读内容 -->
    <div class="reader-body" ref="readerRef"
      @click="showTopbar = !showTopbar"
      @touchstart="onTouchStart" @touchend="onTouchEnd">

      <div class="reader-content" :style="{ fontSize: fontSize + 'px', lineHeight }">
        <h2 class="reader-chapter-title">{{ currentChapter?.title }}</h2>
        <div v-if="loading" class="loading-spinner"><div class="spinner"></div></div>
        <p v-else v-for="(p, i) in paragraphs" :key="i" class="reader-paragraph"
          :style="{ textIndent: i === 0 ? '0' : '2em' }">{{ p }}</p>
      </div>
    </div>

    <!-- 底部导航 -->
    <div class="reader-bottom" v-if="showTopbar">
      <button class="nav-btn" @click="prevChapter" :disabled="!hasPrev">← 上一章</button>
      <span class="chapter-info">{{ currentIndex + 1 }} / {{ chapterList.length }}</span>
      <button class="nav-btn" @click="nextChapter" :disabled="!hasNext">下一章 →</button>
    </div>

    <ReaderSettingsPanel
      :visible="showSettings"
      :fontSize="fontSize"
      :lineHeight="lineHeight"
      :theme="theme"
      :isFav="isFavorited"
      @fontChange="changeFontSize"
      @lineHeightChange="changeLineHeight"
      @update:theme="theme = $event"
      @toggleFav="toggleFavorite"
    />
    <ChapterListPanel
      :visible="showChapterList"
      :chapters="chapterList"
      :currentIndex="currentIndex"
      @select="jumpToChapter"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/api/client'
import { useReaderSettings, useShelf, useProgress } from '@/composables/useReader'
import type { Novel, Chapter } from '@/types'
import ReaderSettingsPanel from '@/components/ReaderSettingsPanel.vue'
import ChapterListPanel from '@/components/ChapterListPanel.vue'

const route = useRoute()
const router = useRouter()
const novelId = computed(() => Number(route.params.id))

// Composable hooks
const { theme, fontSize, lineHeight, changeFontSize, changeLineHeight } = useReaderSettings()
const { toggleFavorite: tf, isFavorited: fav } = useShelf()
const { saveProgress, loadProgress } = useProgress(novelId)

// State
const novel = ref<Novel | null>(null)
const chapterList = ref<Chapter[]>([])
const currentChapter = ref<Chapter | null>(null)
const paragraphs = ref<string[]>([])
const loading = ref(false)
const currentIndex = ref(0)
const showTopbar = ref(true)
const showSettings = ref(false)
const showChapterList = ref(false)
const readerRef = ref<HTMLElement>()

// Computed
const isFavorited = computed(() => fav(novelId.value))
const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value < chapterList.value.length - 1)

// Touch
let touchStartX = 0
function onTouchStart(e: TouchEvent) { touchStartX = e.touches[0].clientX }
function onTouchEnd(e: TouchEvent) {
  const diff = e.changedTouches[0].clientX - touchStartX
  if (Math.abs(diff) > 60) diff > 0 ? prevChapter() : nextChapter()
}

async function loadChapter(index: number) {
  const ch = chapterList.value[index]
  if (!ch) return
  loading.value = true
  currentIndex.value = index
  try {
    const resp = await api.novelChapter(novelId.value, ch.id)
    const data = resp._decrypted?.data || resp
    currentChapter.value = { ...ch, content: data.content || data }
    paragraphs.value = (data.content || data).replace(/\r/g, '').split('\n').filter((p: string) => p.trim())
    saveProgress(index)
  } catch {
    paragraphs.value = ['加载失败，请重试']
  } finally { loading.value = false }
}

function prevChapter() { if (hasPrev.value) loadChapter(currentIndex.value - 1) }
function nextChapter() { if (hasNext.value) loadChapter(currentIndex.value + 1) }
function jumpToChapter(i: number) { loadChapter(i); showChapterList.value = false }
function toggleFavorite() { tf(novelId.value) }
function goBack() { router.back() }

onMounted(async () => {
  try {
    const resp = await api.novelDetail(novelId.value)
    novel.value = resp._decrypted?.data || resp
    const chResp = await api.novelChapters(novelId.value)
    chapterList.value = chResp._decrypted?.data?.list || chResp._decrypted?.data || []
    const saved = loadProgress()
    const startIdx = chapterList.value[saved] ? saved : 0
    if (chapterList.value[startIdx]) await loadChapter(startIdx)
  } catch (e) { console.error(e) }
})
</script>

<style scoped>
.reader-page { min-height: 100vh; position: relative; transition: background 0.3s, color 0.3s; }
.reader-page.theme-dark { background: #0d1321; color: #c8d0e0; }
.reader-page.theme-sepia { background: #f5e6c8; color: #5b4636; }
.reader-page.theme-light { background: #ffffff; color: #333; }
.reader-topbar {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 16px; height: 48px;
  background: rgba(13,19,33,0.9); backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border);
}
.topbar-btn { padding: 6px 12px; border-radius: 14px; border: 1px solid var(--border); background: transparent; color: inherit; font-size: 13px; cursor: pointer; }
.topbar-title { font-size: 15px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px; }
.topbar-actions { display: flex; gap: 6px; }
.reader-body { max-width: 720px; margin: 0 auto; padding: 64px 20px 80px; min-height: 100vh; cursor: pointer; }
.reader-chapter-title { font-size: 1.2em; font-weight: 700; text-align: center; margin-bottom: 24px; }
.reader-paragraph { margin-bottom: 1.2em; }
.reader-bottom {
  position: fixed; bottom: 0; left: 0; right: 0;
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 16px; z-index: 100;
  background: rgba(13,19,33,0.95); backdrop-filter: blur(10px);
  border-top: 1px solid var(--border);
}
.nav-btn { padding: 8px 20px; border-radius: 18px; border: 1px solid var(--border); background: transparent; color: inherit; font-size: 13px; cursor: pointer; }
.nav-btn:disabled { opacity: 0.3; }
.chapter-info { font-size: 12px; color: var(--text-muted); }
.loading-spinner { text-align: center; padding: 40px; }
.spinner { width: 28px; height: 28px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
