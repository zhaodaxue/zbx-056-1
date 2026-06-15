<template>
  <div class="layout-view">
    <div class="toolbar">
      <div class="toolbar-left">
        <h2 class="page-title">监测点布设</h2>
        <span :class="['status-badge', validation.isValid ? 'status-valid' : 'status-invalid']">
          {{ validation.isValid ? '✓ 布设合规' : '✗ 存在违规' }}
        </span>
      </div>
      <div class="toolbar-right">
        <button class="btn btn-secondary" @click="handleClear" :disabled="points.length === 0">
          清空点位
        </button>
        <button
          class="btn btn-success"
          @click="handleSubmit"
          :disabled="!validation.isValid || points.length === 0 || isSubmitting"
        >
          {{ isSubmitting ? '提交中...' : '提交布设方案' }}
        </button>
      </div>
    </div>

    <div class="main-content">
      <div class="canvas-section">
        <PlanCanvas
          v-model:points="points"
          :blast-center="config.blastCenter"
          :buildings="config.buildings"
          :canvas-size="config.canvasSize"
          :violations="validation.pointViolations"
          :show-distances="true"
          @point-added="handlePointAdded"
          @point-moved="handlePointMoved"
        />
        <div class="canvas-legend">
          <div class="legend-item">
            <span class="legend-color blast"></span>
            <span>爆心</span>
          </div>
          <div class="legend-item">
            <span class="legend-color building"></span>
            <span>既有建筑</span>
          </div>
          <div class="legend-item">
            <span class="legend-color buffer"></span>
            <span>建筑缓冲带(40px)</span>
          </div>
          <div class="legend-item">
            <span class="legend-color forbidden"></span>
            <span>爆心禁区(80px)</span>
          </div>
          <div class="legend-item">
            <span class="legend-color point-valid"></span>
            <span>合规监测点</span>
          </div>
          <div class="legend-item">
            <span class="legend-color point-invalid"></span>
            <span>违规监测点</span>
          </div>
        </div>
      </div>

      <div class="sidebar">
        <PointList
          v-model:points="points"
          :violations="validation.violations"
          :point-violations="validation.pointViolations"
          @delete-point="handlePointDeleted"
        />
      </div>
    </div>

    <div v-if="showSuccessModal" class="modal-overlay" @click="showSuccessModal = false">
      <div class="modal-content success" @click.stop>
        <div class="modal-icon">✓</div>
        <h3>提交成功</h3>
        <p>布设方案已保存，已生成快照记录。</p>
        <div class="modal-actions">
          <button class="btn btn-outline" @click="showSuccessModal = false; handleClear()">
            继续布设
          </button>
          <button class="btn btn-primary" @click="goToSnapshot">
            查看快照
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import PlanCanvas from '../components/PlanCanvas.vue'
import PointList from '../components/PointList.vue'
import { validatePoints } from '../utils/validation'
import { api } from '../services/api'
import { saveSnapshotToLocal } from '../utils/storage'

const router = useRouter()

const config = reactive({
  canvasSize: { width: 900, height: 600 },
  blastCenter: { x: 450, y: 300 },
  buildings: []
})

const points = ref([])
const isSubmitting = ref(false)
const showSuccessModal = ref(false)
const lastSnapshotId = ref(null)

const validation = computed(() => {
  return validatePoints(points.value, config.blastCenter, config.buildings)
})

watch(points, () => {
  // 实时校验已在 computed 中自动处理
}, { deep: true })

onMounted(async () => {
  try {
    const serverConfig = await api.getConfig()
    Object.assign(config, serverConfig)
  } catch (err) {
    console.error('加载配置失败:', err)
  }
})

function handlePointAdded(point) {
  console.log('点位已添加:', point)
}

function handlePointMoved({ pointId, x, y }) {
  console.log('点位已移动:', pointId, x, y)
}

function handlePointDeleted(pointId) {
  console.log('点位已删除:', pointId)
}

function handleClear() {
  points.value = []
}

async function handleSubmit() {
  if (!validation.value.isValid || points.value.length === 0) return

  isSubmitting.value = true
  try {
    const snapshot = await api.createSnapshot({
      points: points.value,
      blastCenter: config.blastCenter,
      buildings: config.buildings,
      canvasSize: config.canvasSize
    })

    saveSnapshotToLocal(snapshot)
    lastSnapshotId.value = snapshot.id
    showSuccessModal.value = true
  } catch (err) {
    console.error('提交失败:', err)
    alert('提交失败: ' + err.message)
  } finally {
    isSubmitting.value = false
  }
}

function goToSnapshot() {
  if (lastSnapshotId.value) {
    router.push(`/snapshots/${lastSnapshotId.value}`)
  }
}
</script>

<style scoped>
.layout-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.toolbar {
  background: white;
  border-radius: 8px;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  margin: 0;
  font-size: 22px;
  color: #333;
}

.toolbar-right {
  display: flex;
  gap: 12px;
}

.main-content {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.canvas-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.canvas-legend {
  background: white;
  border-radius: 8px;
  padding: 12px 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #555;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  flex-shrink: 0;
}

.legend-color.blast {
  background: #f44336;
  border-radius: 50%;
}

.legend-color.building {
  background: #e3f2fd;
  border: 2px solid #1976d2;
}

.legend-color.buffer {
  background: rgba(255, 193, 7, 0.3);
  border: 1px dashed #ff9800;
}

.legend-color.forbidden {
  background: rgba(244, 67, 54, 0.1);
  border: 2px dashed #f44336;
}

.legend-color.point-valid {
  background: #4caf50;
  border-radius: 50%;
  border: 2px solid white;
}

.legend-color.point-invalid {
  background: #f44336;
  border-radius: 50%;
  border: 2px solid white;
}

.sidebar {
  width: 340px;
  flex-shrink: 0;
  height: 600px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  max-width: 400px;
  width: 90%;
}

.modal-content.success .modal-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #4caf50;
  color: white;
  font-size: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.modal-content h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: #333;
}

.modal-content p {
  color: #666;
  margin: 0 0 24px 0;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}
</style>
