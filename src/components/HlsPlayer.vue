<template>
  <div class="player-wrapper" ref="wrapperRef">
    <video ref="videoRef" class="hls-video" :poster="poster"
      @click="togglePlay" @timeupdate="onTimeUpdate" @loadedmetadata="onLoaded"
      :class="{ playing: isPlaying }"></video>

    <!-- 播放按钮 (视频未播放时显示) -->
    <div v-if="!isPlaying && !isEnded" class="center-play-btn" @click="togglePlay">
      <div class="play-icon">▶</div>
    </div>

    <!-- 封面遮罩 -->
    <div v-if="!isPlaying && poster" class="poster-overlay" @click="togglePlay">
      <img :src="poster" alt="cover" />
    </div>

    <!-- 控制条 -->
    <div class="player-controls" v-show="isPlaying || showControls"
      @mouseenter="showControls = true" @mouseleave="showControls = false">
      <div class="progress-wrap" @click="seekTo">
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: progressPct + '%' }"></div>
        </div>
      </div>
      <div class="controls-row">
        <div class="controls-left">
          <button class="ctrl-btn" @click="togglePlay">{{ isPlaying ? '⏸' : '▶' }}</button>
          <span class="time-text">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
        </div>
        <div class="controls-right">
          <button class="ctrl-btn" @click="toggleMute">{{ isMuted ? '🔇' : '🔊' }}</button>
          <input type="range" class="volume-slider" min="0" max="1" step="0.05" v-model.number="volume" @input="setVolume" />
          <button class="ctrl-btn" @click="toggleFullscreen">⛶</button>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
    </div>

    <!-- 错误状态 -->
    <div v-if="error" class="error-overlay">
      <p>⚠️ 播放失败</p>
      <button class="retry-btn" @click="loadSource">重试</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import Hls from 'hls.js'
import { decodeM3u8 } from '@/utils/media'

const props = defineProps<{
  src: string
  poster?: string
  autoplay?: boolean
}>()
const emit = defineEmits<{
  timeupdate: [time: number, duration: number]
  ended: []
}>()

const wrapperRef = ref<HTMLElement>()
const videoRef = ref<HTMLVideoElement>()
const isPlaying = ref(false)
const isEnded = ref(false)
const showControls = ref(false)
const isMuted = ref(false)
const loading = ref(true)
const error = ref('')
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(1)
const progressPct = ref(0)

let hls: Hls | null = null

function formatTime(s: number): string {
  if (!s || !isFinite(s)) return '00:00'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

async function loadSource() {
  const video = videoRef.value
  if (!video || !props.src) return
  loading.value = true
  error.value = ''
  isEnded.value = false

  // 获取并解码 m3u8（前端直接处理双重 Base64）
  async function getDecodedUrl(rawUrl: string): Promise<string> {
    try {
      const resp = await fetch(rawUrl)
      const text = await resp.text()
      const decoded = decodeM3u8(text)
      // 用 Blob URL 让 Hls.js 加载解码后的内容
      const blob = new Blob([decoded], { type: 'application/vnd.apple.mpegurl' })
      return URL.createObjectURL(blob)
    } catch {
      // 解码失败则回退到原始 URL
      return rawUrl
    }
  }
  const playUrl = await getDecodedUrl(props.src)

  if (Hls.isSupported()) {
    hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 30,
    })
    hls.loadSource(playUrl)
    hls.attachMedia(video)
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      loading.value = false
      if (props.autoplay) video.play()
    })
    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (data.fatal) {
        error.value = '视频加载失败'
        loading.value = false
      }
    })
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    // Safari 原生 HLS 支持
    video.src = playUrl
    video.addEventListener('loadedmetadata', () => { loading.value = false })
  } else {
    error.value = '浏览器不支持 HLS 播放'
    loading.value = false
  }
}

function togglePlay() {
  const video = videoRef.value
  if (!video) return
  if (video.paused) {
    video.play()
    isPlaying.value = true
  } else {
    video.pause()
    isPlaying.value = false
  }
}

function toggleMute() {
  const video = videoRef.value
  if (!video) return
  video.muted = !video.muted
  isMuted.value = video.muted
}

function setVolume() {
  const video = videoRef.value
  if (!video) return
  video.volume = volume.value
}

function seekTo(e: MouseEvent) {
  const video = videoRef.value
  const track = e.currentTarget as HTMLElement
  if (!video || !track) return
  const rect = track.getBoundingClientRect()
  const pct = (e.clientX - rect.left) / rect.width
  video.currentTime = pct * (video.duration || 0)
}

function toggleFullscreen() {
  if (!wrapperRef.value) return
  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else {
    wrapperRef.value.requestFullscreen()
  }
}

function onTimeUpdate() {
  const video = videoRef.value
  if (!video) return
  currentTime.value = video.currentTime
  duration.value = video.duration || 0
  progressPct.value = video.duration ? (video.currentTime / video.duration) * 100 : 0
  emit('timeupdate', video.currentTime, video.duration)
}

function onLoaded() {
  loading.value = false
  duration.value = videoRef.value?.duration || 0
}

watch(() => props.src, () => { loadSource() })

onMounted(() => { loadSource() })
onUnmounted(() => { hls?.destroy() })
</script>

<style scoped>
.player-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  background: #000;
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
}
.hls-video { width: 100%; height: 100%; display: block; }
.poster-overlay { position: absolute; inset: 0; z-index: 1; }
.poster-overlay img { width: 100%; height: 100%; object-fit: cover; }
.center-play-btn {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  z-index: 2; cursor: pointer;
}
.play-icon {
  width: 64px; height: 64px;
  background: rgba(0, 212, 255, 0.9);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 26px;
  box-shadow: 0 0 40px rgba(0, 212, 255, 0.3);
  transition: transform 0.2s;
}
.play-icon:hover { transform: scale(1.1); }
.player-controls {
  position: absolute; bottom: 0; left: 0; right: 0;
  padding: 16px;
  background: linear-gradient(transparent, rgba(0,0,0,0.85));
  z-index: 3;
  transition: opacity 0.3s;
}
.progress-wrap { width: 100%; height: 6px; cursor: pointer; margin-bottom: 8px; padding: 4px 0; }
.progress-track { width: 100%; height: 4px; background: rgba(255,255,255,0.15); border-radius: 2px; }
.progress-fill { height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent-sub)); border-radius: 2px; transition: width 0.1s; }
.controls-row { display: flex; justify-content: space-between; align-items: center; color: rgba(255,255,255,0.8); font-size: 12px; }
.controls-left, .controls-right { display: flex; align-items: center; gap: 8px; }
.ctrl-btn { background: none; border: none; color: inherit; font-size: 16px; cursor: pointer; padding: 4px; }
.time-text { font-family: var(--font-mono); font-size: 12px; }
.volume-slider { width: 60px; accent-color: var(--accent); }
.loading-overlay, .error-overlay {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  background: rgba(0,0,0,0.6); z-index: 4; gap: 12px;
}
.spinner { width: 36px; height: 36px; border: 3px solid rgba(255,255,255,0.1); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.retry-btn { padding: 8px 20px; border-radius: 18px; background: var(--accent); color: var(--text-inverse); border: none; font-size: 13px; cursor: pointer; }
</style>
