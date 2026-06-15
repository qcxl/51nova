<template>
  <Transition name="slide">
    <div v-if="visible" class="chapter-panel">
      <h3 class="panel-title">章节列表</h3>
      <div class="chapter-list">
        <button v-for="(ch, i) in chapters" :key="ch.id"
          :class="['chapter-item', { active: i === currentIndex }]"
          @click="$emit('select', i)">
          <span>{{ ch.title }}</span>
          <span v-if="i === currentIndex" class="indicator">◀ 正在阅读</span>
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { Chapter } from '@/types'

defineProps<{
  visible: boolean
  chapters: Chapter[]
  currentIndex: number
}>()

defineEmits<{
  select: [index: number]
}>()
</script>

<style scoped>
.chapter-panel {
  position: fixed; top: 48px; right: 0; z-index: 99;
  width: 280px; max-height: calc(100vh - 100px); overflow-y: auto;
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 0 0 0 var(--radius-md);
}
.panel-title { padding: 12px 16px; font-size: 14px; font-weight: 600; border-bottom: 1px solid var(--border); }
.chapter-list { padding: 8px 0; }
.chapter-item {
  display: flex; justify-content: space-between; align-items: center;
  width: 100%; padding: 10px 16px; font-size: 13px;
  background: none; border: none; color: inherit; text-align: left;
  cursor: pointer; transition: 0.15s;
}
.chapter-item:hover { background: rgba(255,255,255,0.05); }
.chapter-item.active { color: var(--accent); }
.indicator { font-size: 11px; color: var(--accent); }
.slide-enter-active, .slide-leave-active { transition: transform 0.2s; }
.slide-enter-from, .slide-leave-to { transform: translateX(100%); }
</style>
