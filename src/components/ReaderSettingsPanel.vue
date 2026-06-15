<template>
  <Transition name="slide">
    <div v-if="visible" class="settings-panel">
      <div class="settings-group">
        <span class="s-label">字号</span>
        <div class="s-control">
          <button class="size-btn" @click="$emit('fontChange', -2)">A−</button>
          <span class="size-value">{{ fontSize }}</span>
          <button class="size-btn" @click="$emit('fontChange', 2)">A+</button>
        </div>
      </div>
      <div class="settings-group">
        <span class="s-label">行距</span>
        <div class="s-control">
          <button class="size-btn" @click="$emit('lineHeightChange', -0.1)">−</button>
          <span class="size-value">{{ lineHeight.toFixed(1) }}</span>
          <button class="size-btn" @click="$emit('lineHeightChange', 0.1)">+</button>
        </div>
      </div>
      <div class="settings-group">
        <span class="s-label">主题</span>
        <div class="theme-options">
          <button :class="['theme-dot', { active: theme === 'dark' }]" @click="$emit('update:theme', 'dark')" title="暗黑">🌙</button>
          <button :class="['theme-dot', 'sepia', { active: theme === 'sepia' }]" @click="$emit('update:theme', 'sepia')" title="羊皮纸">📜</button>
          <button :class="['theme-dot', 'light-mode', { active: theme === 'light' }]" @click="$emit('update:theme', 'light')" title="明亮">☀️</button>
        </div>
      </div>
      <div class="settings-group">
        <span class="s-label">收藏</span>
        <button class="fav-btn" @click="$emit('toggleFav')">{{ isFav ? '❤️ 已收藏' : '🤍 加入书架' }}</button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean
  fontSize: number
  lineHeight: number
  theme: string
  isFav: boolean
}>()
defineEmits<{
  fontChange: [delta: number]
  lineHeightChange: [delta: number]
  'update:theme': [val: string]
  toggleFav: []
}>()
</script>

<style scoped>
.settings-panel {
  position: fixed; top: 48px; right: 0; z-index: 99;
  width: 260px; padding: 16px;
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 0 0 0 var(--radius-md);
}
:deep(.theme-sepia) .settings-panel { background: #e8d5b0; }
:deep(.theme-light) .settings-panel { background: #f5f5f5; color: #333; }
.settings-group { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.s-label { font-size: 13px; }
.s-control { display: flex; align-items: center; gap: 8px; }
.size-btn { width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--border); background: transparent; color: inherit; font-size: 14px; cursor: pointer; }
.size-value { font-size: 13px; min-width: 24px; text-align: center; font-family: var(--font-mono); }
.theme-options { display: flex; gap: 6px; }
.theme-dot { width: 34px; height: 34px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; background: #0d1321; font-size: 16px; }
.theme-dot.active { border-color: var(--accent); }
.theme-dot.sepia { background: #f5e6c8; }
.theme-dot.light-mode { background: #fff; border-color: #ddd; }
.fav-btn { padding: 6px 14px; border-radius: 14px; border: 1px solid var(--border); background: transparent; color: inherit; font-size: 12px; cursor: pointer; }
.slide-enter-active, .slide-leave-active { transition: transform 0.2s; }
.slide-enter-from, .slide-leave-to { transform: translateX(100%); }
</style>
