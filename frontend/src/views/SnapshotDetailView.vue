<template>
  <div class="snapshot-detail-view">
    <div class="page-header">
      <div class="header-left">
        <button class="btn btn-outline" @click="goBack">
          ← 返回列表
        </button>
        <h2 class="page-title">布设快照详情</h2>
        <span class="snapshot-id">#{{ snapshot?.id?.slice(0, 8) || '---' }}</span>
      </div>
      <div class="header-right">
        <span :class="['status-badge', snapshot?.validation?.isValid ? 'status-valid' : 'status-invalid']">
          {{ snapshot?.validation?.isValid ? '✓ 布设合规' : '✗ 存在违规' }}
        </span>
        <span class="readonly-badge">只读</span>
      </div>
    </div>

    <div v-if="isLoading" class="loading-state">
      <p>加载中...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠</div>
      <h3>加载失败</h3>
      <p>{{ error }}</p>
      <button class="btn btn-primary" @click="goBack">
        返回列表
      </button>
    </div>

    <div v-else-if="snapshot" class="detail-content">
      <div class="snapshot-meta card">
        <div class="meta-grid">
          <div class="meta-block">
            <span class="meta-label">快照ID</span>
            <span class="meta-value">{{ snapshot.id }}</span>
          </div>
          <div class="meta-block">
            <span class="meta-label">创建时间</span>
            <span class="meta-value">{{ formatDate(snapshot.createdAt) }}</span>
          </div>
          <div class="meta-block">
            <span class="meta-label">监测点数量</span>
            <span class="meta-value">{{ snapshot.points.length }} 个</span>
          </div>
          <div class="meta-block">
            <span class="meta-label">合规状态</span>
            <span :class="['meta-value', snapshot.validation.isValid ? 'text-success' : 'text-danger']">
              {{ snapshot.validation.isValid ? '合规' : '违规' }}
            </span>
          </div>
        </div>
      </div>

      <div class="main-content">
        <div class="canvas-section">
          <div class="card">
            <h3 class="section-title">布设平面图</h3>
            <PlanCanvas
              :points="snapshot.points"
              :blast-center="snapshot.blastCenter"
              :buildings="snapshot.buildings"
              :canvas-size="snapshot.canvasSize"
              :violations="snapshot.validation.pointViolations"
              :readonly="true"
              :show-distances="true"
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
                <span class="legend-color point-valid"></span>
                <span>合规监测点</span>
              </div>
              <div class="legend-item">
                <span class="legend-color point-invalid"></span>
                <span>违规监测点</span>
              </div>
            </div>
          </div>
        </div>

        <div class="sidebar">
          <PointList
            :points="snapshot.points"
            :violations="snapshot.validation.violations"
            :point-violations="snapshot.validation.pointViolations"
            :readonly="true"
          />
        </div>
      </div>

      <div v-if="snapshot.points.length > 0" class="points-table card">
        <h3 class="section-title">点位明细表</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>序号</th>
              <th>仪器编号</th>
              <th>X坐标</th>
              <th>Y坐标</th>
              <th>距爆心距离</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(point, index) in snapshot.points"
              :key="point.id"
              :class="{ 'row-violation': hasPointViolation(point.id) }"
            >
              <td>{{ index + 1 }}</td>
              <td>{{ point.instrumentNo || '-' }}</td>
              <td>{{ point.x }}</td>
              <td>{{ point.y }}</td>
              <td>{{ getDistanceToBlast(point).toFixed(1) }} px</td>
              <td>
                <span :class="['status-badge', hasPointViolation(point.id) ? 'status-invalid' : 'status-valid']">
                  {{ hasPointViolation(point.id) ? '违规' : '合规' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="snapshot.validation.violations.length > 0" class="violations-section card">
        <h3 class="section-title">违规记录</h3>
        <div class="violations-list">
          <div
            v-for="(violation, idx) in snapshot.validation.violations"
            :key="idx"
            class="violation-row"
          >
            <span class="violation-icon">⚠</span>
            <span class="violation-type">{{ getViolationTypeLabel(violation.type) }}</span>
            <span class="violation-point" v-if="violation.pointIndex">
              {{ violation.pointIndex }}号点
            </span>
            <span class="violation-message">{{ violation.message }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PlanCanvas from '../components/PlanCanvas.vue'
import PointList from '../components/PointList.vue'
import { api } from '../services/api'
import { getLocalSnapshot } from '../utils/storage'
import { distance } from '../utils/validation'

const route = useRoute()
const router = useRouter()

const snapshot = ref(null)
const isLoading = ref(true)
const error = ref(null)

onMounted(async () => {
  const id = route.params.id
  await loadSnapshot(id)
})

async function loadSnapshot(id) {
  isLoading.value = true
  error.value = null
  try {
    try {
      snapshot.value = await api.getSnapshot(id)
    } catch (err) {
      snapshot.value = getLocalSnapshot(id)
      if (!snapshot.value) throw err
    }
    if (!snapshot.value) {
      error.value = '快照不存在'
    }
  } catch (err) {
    error.value = err.message || '加载失败'
  } finally {
    isLoading.value = false
  }
}

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function goBack() {
  router.push('/snapshots')
}

function hasPointViolation(pointId) {
  return snapshot.value?.validation?.pointViolations?.[pointId]?.length > 0
}

function getDistanceToBlast(point) {
  return distance(point, snapshot.value.blastCenter)
}

function getViolationTypeLabel(type) {
  const labels = {
    'blast_distance': '爆心距离',
    'point_distance': '点间距离',
    'buffer_zone': '缓冲带要求'
  }
  return labels[type] || type
}
</script>

<style scoped>
.snapshot-detail-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  background: white;
  border-radius: 8px;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  margin: 0;
  font-size: 22px;
  color: #333;
}

.snapshot-id {
  font-family: monospace;
  font-size: 14px;
  color: #666;
  background: #f5f5f5;
  padding: 4px 10px;
  border-radius: 4px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.readonly-badge {
  background: #757575;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.loading-state, .error-state {
  background: white;
  border-radius: 8px;
  padding: 60px 24px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.error-icon {
  font-size: 64px;
  color: #ff9800;
  margin-bottom: 16px;
}

.error-state h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: #333;
}

.error-state p {
  color: #666;
  margin: 0 0 24px 0;
}

.snapshot-meta .meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.meta-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-label {
  font-size: 13px;
  color: #888;
}

.meta-value {
  font-size: 15px;
  color: #333;
  font-weight: 500;
  word-break: break-all;
}

.text-success {
  color: #2e7d32;
}

.text-danger {
  color: #c62828;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.main-content {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.canvas-section {
  flex: 1;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #333;
  padding-bottom: 12px;
  border-bottom: 2px solid #eee;
}

.canvas-legend {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eee;
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
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

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.data-table th {
  background: #f5f5f5;
  font-weight: 600;
  color: #555;
  font-size: 14px;
}

.data-table td {
  font-size: 14px;
  color: #333;
}

.data-table tbody tr:hover {
  background: #f9f9f9;
}

.data-table .row-violation {
  background: #ffebee;
}

.data-table .row-violation:hover {
  background: #ffcdd2;
}

.violations-section .violations-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.violation-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #fff3e0;
  border-radius: 6px;
  border-left: 4px solid #ff9800;
}

.violation-icon {
  color: #ff9800;
  font-size: 18px;
}

.violation-type {
  background: #ffe0b2;
  color: #e65100;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.violation-point {
  font-weight: 600;
  color: #e65100;
  font-size: 14px;
}

.violation-message {
  flex: 1;
  color: #5d4037;
  font-size: 14px;
}
</style>
