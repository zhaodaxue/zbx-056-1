<template>
  <div class="point-list">
    <div class="list-header">
      <h3>监测点位</h3>
      <span class="point-count">{{ points.length }}/{{ maxPoints }}</span>
    </div>

    <div v-if="points.length === 0" class="empty-state">
      <p>暂未布设监测点</p>
      <p class="hint">在左侧平面图上点击添加</p>
    </div>

    <div v-else class="points-container">
      <div
        v-for="(point, index) in points"
        :key="point.id"
        :class="['point-item', { 'has-violation': getPointViolations(point.id).length > 0 }]"
      >
        <div class="point-header">
          <div class="point-badge" :class="{ 'violation': getPointViolations(point.id).length > 0 }">
            {{ index + 1 }}
          </div>
          <div class="point-info">
            <div class="point-coords">
              坐标: ({{ point.x }}, {{ point.y }})
            </div>
            <div v-if="!readonly" class="point-input">
              <label>仪器编号:</label>
              <input
                v-model="point.instrumentNo"
                type="text"
                placeholder="如: VM-001"
                maxlength="20"
                @input="handleInstrumentChange(point, $event)"
              />
            </div>
            <div v-else class="point-instrument">
              仪器: {{ point.instrumentNo || '未填写' }}
            </div>
          </div>
          <button
            v-if="!readonly"
            class="delete-btn"
            @click="handleDelete(point.id)"
            title="删除点位"
          >×</button>
        </div>

        <div v-if="getPointViolations(point.id).length > 0" class="violations">
          <div
            v-for="(violation, vIdx) in getPointViolations(point.id)"
            :key="vIdx"
            class="violation-item"
          >
            <span class="violation-icon">⚠</span>
            <span class="violation-text">{{ violation.message }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="globalViolations.length > 0" class="global-violations">
      <h4>全局规则</h4>
      <div
        v-for="(violation, idx) in globalViolations"
        :key="idx"
        class="violation-item global"
      >
        <span class="violation-icon">⚠</span>
        <span class="violation-text">{{ violation.message }}</span>
      </div>
    </div>

    <div class="rules-info">
      <h4>布设规则</h4>
      <ul>
        <li>距爆心 ≥ {{ rules.MIN_DISTANCE_TO_BLAST }}px</li>
        <li>点间距 ≥ {{ rules.MIN_DISTANCE_BETWEEN_POINTS }}px</li>
        <li>至少1点距建筑 ≤ {{ rules.BUFFER_ZONE_TO_BUILDING }}px</li>
        <li>最多布设 {{ maxPoints }} 个监测点</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RULES } from '../utils/validation'

const props = defineProps({
  points: {
    type: Array,
    default: () => []
  },
  violations: {
    type: Array,
    default: () => []
  },
  pointViolations: {
    type: Object,
    default: () => ({})
  },
  readonly: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:points', 'delete-point', 'instrument-change'])

const rules = computed(() => RULES)
const maxPoints = computed(() => RULES.MAX_POINTS)

function getPointViolations(pointId) {
  return props.pointViolations[pointId] || []
}

const globalViolations = computed(() => {
  return props.violations.filter(v => v.pointId === null)
})

function handleDelete(pointId) {
  const newPoints = props.points.filter(p => p.id !== pointId)
  emit('update:points', newPoints)
  emit('delete-point', pointId)
}

function handleInstrumentChange(point, event) {
  const newPoints = props.points.map(p =>
    p.id === point.id
      ? { ...p, instrumentNo: event.target.value }
      : p
  )
  emit('update:points', newPoints)
  emit('instrument-change', { pointId: point.id, instrumentNo: event.target.value })
}
</script>

<style scoped>
.point-list {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 100%;
  overflow-y: auto;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #eee;
}

.list-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.point-count {
  background: #e3f2fd;
  color: #1976d2;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: bold;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.empty-state p {
  margin: 4px 0;
}

.empty-state .hint {
  font-size: 13px;
}

.points-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.point-item {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #e0e0e0;
  transition: all 0.2s ease;
}

.point-item.has-violation {
  background: #ffebee;
  border-color: #ef5350;
}

.point-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.point-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #4caf50;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
  flex-shrink: 0;
}

.point-badge.violation {
  background: #f44336;
}

.point-info {
  flex: 1;
  min-width: 0;
}

.point-coords {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.point-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.point-input label {
  font-size: 13px;
  color: #555;
  white-space: nowrap;
}

.point-input input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  min-width: 0;
}

.point-input input:focus {
  outline: none;
  border-color: #1976d2;
}

.point-instrument {
  font-size: 13px;
  color: #555;
}

.delete-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: #ffcdd2;
  color: #c62828;
  border-radius: 4px;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.delete-btn:hover {
  background: #ef9a9a;
}

.violations {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #ef5350;
}

.violation-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 12px;
  color: #c62828;
  padding: 4px 0;
}

.violation-icon {
  color: #ff9800;
  font-size: 14px;
}

.violation-text {
  flex: 1;
}

.global-violations {
  margin-top: 16px;
  padding: 12px;
  background: #fff3e0;
  border-radius: 8px;
  border-left: 4px solid #ff9800;
}

.global-violations h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #e65100;
}

.global-violations .violation-item.global {
  color: #e65100;
}

.rules-info {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 2px solid #eee;
}

.rules-info h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #555;
}

.rules-info ul {
  margin: 0;
  padding-left: 20px;
  font-size: 12px;
  color: #666;
  line-height: 1.8;
}
</style>
