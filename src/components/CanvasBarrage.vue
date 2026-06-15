<template>
  <div class="barrage-canvas-wrapper" ref="wrapperRef">
    <canvas ref="canvasRef" class="barrage-canvas"></canvas>
    <div class="barrage-input-row" v-if="showInput">
      <input v-model="inputText" class="barrage-input" placeholder="发弹幕..."
        @keyup.enter="sendBarrage" maxlength="50" />
      <button class="barrage-send" @click="sendBarrage">发送</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'

const props = withDefaults(defineProps<{
  videoEl?: HTMLVideoElement | null
  barrages?: BarrageItem[]
  speed?: number       // 像素/帧
  opacity?: number     // 透明度
  fontSize?: number    // 字号
  showInput?: boolean
  paused?: boolean
}>(), {
  speed: 2,
  opacity: 0.85,
  fontSize: 18,
  showInput: false,
  paused: false,
})

interface BarrageItem {
  id?: number | string
  text: string
  time?: number       // 出现时间（秒）
  color?: string
  fontSize?: number
}

interface ActiveBarrage {
  text: string
  x: number
  y: number
  width: number
  speed: number
  color: string
  fontSize: number
  opacity: number
}

const wrapperRef = ref<HTMLElement>()
const canvasRef = ref<HTMLCanvasElement>()
const inputText = ref('')
const activeBarrages: ActiveBarrage[] = []
let animationId = 0
let lastTime = 0
const LANE_HEIGHT = 28           // 每条弹幕高度
const ROW_GAP = 4                // 行间距
const MAX_LANES = 15

function resize() {
  const canvas = canvasRef.value
  const wrapper = wrapperRef.value
  if (!canvas || !wrapper) return
  canvas.width = wrapper.clientWidth
  canvas.height = wrapper.clientHeight
}

function sendBarrage() {
  const text = inputText.value.trim()
  if (!text) return
  emit('send', text)
  inputText.value = ''
}

function addBarrage(item: BarrageItem) {
  if (!canvasRef.value) return
  const ctx = canvasRef.value.getContext('2d')
  if (!ctx) return
  ctx.font = `${item.fontSize || props.fontSize}px sans-serif`
  const width = ctx.measureText(item.text).width
  activeBarrages.push({
    text: item.text,
    x: canvasRef.value.width,
    y: 0,
    width,
    speed: 2 + Math.random() * props.speed,
    color: item.color || randomColor(),
    fontSize: item.fontSize || props.fontSize,
    opacity: props.opacity,
  })
}

function randomColor(): string {
  const colors = ['#ff4757', '#ffa502', '#2ed573', '#1e90ff', '#ff6b81', '#eccc68', '#a29bfe', '#fd79a8', '#00d4ff']
  return colors[Math.floor(Math.random() * colors.length)]
}

function getLaneCount(height: number): number {
  return Math.min(Math.floor(height / (LANE_HEIGHT + ROW_GAP)), MAX_LANES)
}

function findLaneForBarrage(barrage: ActiveBarrage, canvasWidth: number, canvasHeight: number): number {
  const laneCount = getLaneCount(canvasHeight)
  // 找到最先空出来的车道
  const laneEndX = new Array(laneCount).fill(0)
  for (const b of activeBarrages) {
    const lane = Math.floor(b.y / (LANE_HEIGHT + ROW_GAP))
    if (lane >= 0 && lane < laneCount) {
      laneEndX[lane] = Math.max(laneEndX[lane], b.x + b.width)
    }
  }
  // 选择最右边的空车道
  let bestLane = 0
  let bestEndX = -1
  for (let i = 0; i < laneCount; i++) {
    if (laneEndX[i] > bestEndX) {
      bestEndX = laneEndX[i]
      bestLane = i
    }
  }
  return bestLane
}

function render(timestamp: number) {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dt = lastTime ? (timestamp - lastTime) / 16 : 1
  lastTime = timestamp
  const paused = props.paused

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (paused) {
    // 暂停时停止移动，但仍绘制已有弹幕
  }

  for (let i = activeBarrages.length - 1; i >= 0; i--) {
    const b = activeBarrages[i]

    if (!paused) {
      b.x -= b.speed * dt
    }

    // 设置弹幕位置（第一帧分配车道）
    if (b.y === 0) {
      const lane = findLaneForBarrage(b, canvas.width, canvas.height)
      b.y = lane * (LANE_HEIGHT + ROW_GAP) + LANE_HEIGHT
    }

    // 绘制弹幕
    ctx.globalAlpha = b.opacity
    ctx.font = `bold ${b.fontSize}px sans-serif`
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'
    ctx.lineWidth = 3
    ctx.strokeText(b.text, b.x, b.y)
    ctx.fillStyle = b.color
    ctx.fillText(b.text, b.x, b.y)

    // 超出屏幕则移除
    if (b.x + b.width < 0) {
      activeBarrages.splice(i, 1)
    }
  }

  ctx.globalAlpha = 1
  animationId = requestAnimationFrame(render)
}

function loadBarrages(items: BarrageItem[], currentTime: number) {
  for (const item of items) {
    if (item.time !== undefined && item.time <= currentTime) {
      addBarrage(item)
    }
  }
}

watch(() => props.barrages, (val) => {
  if (val) loadBarrages(val, 0)
})

const emit = defineEmits<{ send: [text: string] }>()

onMounted(() => {
  nextTick(() => {
    resize()
    animationId = requestAnimationFrame(render)
    window.addEventListener('resize', resize)
  })
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', resize)
})
</script>

<style scoped>
.barrage-canvas-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.barrage-canvas {
  position: absolute;
  top: 0; left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.barrage-input-row {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
  z-index: 10;
  pointer-events: auto;
  width: 90%;
  max-width: 400px;
}
.barrage-input {
  flex: 1;
  padding: 6px 12px;
  border-radius: 16px;
  border: 1px solid var(--border);
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 13px;
  outline: none;
}
.barrage-input:focus {
  border-color: var(--accent);
}
.barrage-send {
  padding: 6px 14px;
  border-radius: 16px;
  border: none;
  background: var(--accent);
  color: var(--text-inverse);
  font-size: 13px;
  cursor: pointer;
  font-weight: 600;
}
</style>
