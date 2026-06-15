<template>
  <div class="canvas-container" :style="{ width: canvasSize.width + 'px', height: canvasSize.height + 'px' }">
    <svg
      ref="svgRef"
      :width="canvasSize.width"
      :height="canvasSize.height"
      class="plan-canvas"
      @mousedown="handleCanvasMouseDown"
      @mousemove="handleCanvasMouseMove"
      @mouseup="handleCanvasMouseUp"
      @mouseleave="handleCanvasMouseUp"
    >
      <defs>
        <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e0e0e0" stroke-width="1"/>
        </pattern>
      </defs>

      <rect :width="canvasSize.width" :height="canvasSize.height" fill="url(#grid)"/>

      <g v-for="building in buildings" :key="building.id" class="building-group">
        <rect
          v-for="(buffer, idx) in 40"
          :key="'buffer-' + building.id + '-' + idx"
          :x="getBuildingBounds(building).x - idx"
          :y="getBuildingBounds(building).y - idx"
          :width="getBuildingBounds(building).width + idx * 2"
          :height="getBuildingBounds(building).height + idx * 2"
          :rx="4 - idx * 0.1"
          fill="none"
          :stroke="`rgba(255, 193, 7, ${0.05 - idx * 0.001})`"
          stroke-width="1"
          v-if="!readonly"
        />
        <polygon
          :points="buildingPointsToString(building.points)"
          fill="#e3f2fd"
          stroke="#1976d2"
          stroke-width="2"
        />
        <text
          :x="getBuildingCenter(building).x"
          :y="getBuildingCenter(building).y"
          text-anchor="middle"
          dominant-baseline="middle"
          fill="#1565c0"
          font-size="14"
          font-weight="bold"
        >{{ building.name }}</text>
      </g>

      <g class="blast-center-group">
        <circle
          :cx="blastCenter.x"
          :cy="blastCenter.y"
          :r="rules.MIN_DISTANCE_TO_BLAST"
          fill="rgba(244, 67, 54, 0.1)"
          stroke="#f44336"
          stroke-width="2"
          stroke-dasharray="5,5"
        />
        <circle
          :cx="blastCenter.x"
          :cy="blastCenter.y"
          r="12"
          fill="#f44336"
        />
        <text
          :x="blastCenter.x"
          :y="blastCenter.y + 4"
          text-anchor="middle"
          dominant-baseline="middle"
          fill="white"
          font-size="12"
          font-weight="bold"
        >爆</text>
        <text
          :x="blastCenter.x"
          :y="blastCenter.y - 20"
          text-anchor="middle"
          fill="#d32f2f"
          font-size="12"
          font-weight="bold"
        >爆心</text>
      </g>

      <g
        v-for="(point, index) in points"
        :key="point.id"
        :class="['monitor-point', { 'is-violation': isPointViolation(point.id), 'is-dragging': draggingPointId === point.id }]"
        :transform="`translate(${point.x}, ${point.y})`"
        @mousedown.stop="handlePointMouseDown($event, point)"
      >
        <circle
          r="16"
          :fill="isPointViolation(point.id) ? '#f44336' : '#4caf50'"
          stroke="white"
          stroke-width="3"
          class="point-circle"
        />
        <text
          y="4"
          text-anchor="middle"
          dominant-baseline="middle"
          fill="white"
          font-size="14"
          font-weight="bold"
        >{{ index + 1 }}</text>
        <text
          v-if="point.instrumentNo"
          y="32"
          text-anchor="middle"
          fill="#333"
          font-size="11"
        >{{ point.instrumentNo }}</text>
        <g v-if="showDistances">
          <line
            :x1="0"
            :y1="0"
            :x2="blastCenter.x - point.x"
            :y2="blastCenter.y - point.y"
            stroke="#999"
            stroke-width="1"
            stroke-dasharray="3,3"
          />
          <text
            :x="(blastCenter.x - point.x) / 2"
            :y="(blastCenter.y - point.y) / 2 - 5"
            fill="#666"
            font-size="10"
          >{{ getDistanceToBlast(point).toFixed(0) }}px</text>
        </g>
      </g>

      <g v-if="!readonly && canAddPoint" class="add-hint">
        <text
          :x="canvasSize.width / 2"
          :y="canvasSize.height - 20"
          text-anchor="middle"
          fill="#999"
          font-size="13"
        >点击空白处添加监测点（{{ points.length }}/{{ rules.MAX_POINTS }}）</text>
      </g>
    </svg>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { distance, RULES } from '../utils/validation'

const props = defineProps({
  points: {
    type: Array,
    default: () => []
  },
  blastCenter: {
    type: Object,
    required: true
  },
  buildings: {
    type: Array,
    required: true
  },
  canvasSize: {
    type: Object,
    default: () => ({ width: 900, height: 600 })
  },
  violations: {
    type: Object,
    default: () => ({})
  },
  readonly: {
    type: Boolean,
    default: false
  },
  showDistances: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:points', 'point-added', 'point-moved', 'point-selected'])

const svgRef = ref(null)
const draggingPointId = ref(null)
const dragOffset = ref({ x: 0, y: 0 })

const rules = computed(() => RULES)

const canAddPoint = computed(() => props.points.length < RULES.MAX_POINTS)

function isPointViolation(pointId) {
  return props.violations[pointId] && props.violations[pointId].length > 0
}

function buildingPointsToString(points) {
  return points.map(p => `${p.x},${p.y}`).join(' ')
}

function getBuildingBounds(building) {
  const xs = building.points.map(p => p.x)
  const ys = building.points.map(p => p.y)
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys)
  }
}

function getBuildingCenter(building) {
  const bounds = getBuildingBounds(building)
  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2
  }
}

function getDistanceToBlast(point) {
  return distance(point, props.blastCenter)
}

function getSVGCoordinates(event) {
  const svg = svgRef.value
  const rect = svg.getBoundingClientRect()
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }
}

function handleCanvasMouseDown(event) {
  if (props.readonly) return
  if (!canAddPoint.value) return
  if (draggingPointId.value) return

  const coords = getSVGCoordinates(event)

  const target = event.target
  if (target.tagName === 'circle' || target.tagName === 'text') return

  const newPoint = {
    id: `point-${Date.now()}`,
    x: Math.round(coords.x),
    y: Math.round(coords.y),
    instrumentNo: ''
  }

  const newPoints = [...props.points, newPoint]
  emit('update:points', newPoints)
  emit('point-added', newPoint)
}

function handlePointMouseDown(event, point) {
  if (props.readonly) return
  event.preventDefault()
  const coords = getSVGCoordinates(event)
  draggingPointId.value = point.id
  dragOffset.value = {
    x: coords.x - point.x,
    y: coords.y - point.y
  }
  emit('point-selected', point)
}

function handleCanvasMouseMove(event) {
  if (!draggingPointId.value || props.readonly) return

  const coords = getSVGCoordinates(event)
  const newX = Math.max(0, Math.min(props.canvasSize.width, Math.round(coords.x - dragOffset.value.x)))
  const newY = Math.max(0, Math.min(props.canvasSize.height, Math.round(coords.y - dragOffset.value.y)))

  const newPoints = props.points.map(p =>
    p.id === draggingPointId.value
      ? { ...p, x: newX, y: newY }
      : p
  )

  emit('update:points', newPoints)
  emit('point-moved', { pointId: draggingPointId.value, x: newX, y: newY })
}

function handleCanvasMouseUp() {
  if (draggingPointId.value) {
    draggingPointId.value = null
  }
}
</script>

<style scoped>
.canvas-container {
  border: 2px solid #333;
  border-radius: 8px;
  overflow: hidden;
  background: #fafafa;
  position: relative;
}

.plan-canvas {
  cursor: crosshair;
  display: block;
}

.plan-canvas.readonly {
  cursor: default;
}

.monitor-point {
  cursor: move;
  transition: transform 0.1s ease;
}

.monitor-point:hover .point-circle {
  filter: brightness(1.1);
}

.monitor-point.is-violation .point-circle {
  animation: pulse 1.5s infinite;
}

.monitor-point.is-dragging {
  cursor: grabbing;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.add-hint text {
  pointer-events: none;
}
</style>
