<template>
  <div class="snapshots-view">
    <div class="page-header">
      <h2 class="page-title">布设快照记录</h2>
      <div class="header-actions">
        <button class="btn btn-outline" @click="loadSnapshots" :disabled="isLoading">
          {{ isLoading ? '刷新中...' : '刷新列表' }}
        </button>
        <button class="btn btn-primary" @click="goToLayout">
          新增布设
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="loading-state">
      <p>加载中...</p>
    </div>

    <div v-else-if="snapshots.length === 0" class="empty-state">
      <div class="empty-icon">📋</div>
      <h3>暂无快照记录</h3>
      <p>您还没有保存任何布设方案</p>
      <button class="btn btn-primary" @click="goToLayout">
        开始布设
      </button>
    </div>

    <div v-else class="snapshots-grid">
      <div
        v-for="snapshot in snapshots"
        :key="snapshot.id"
        class="snapshot-card"
        @click="viewSnapshot(snapshot.id)"
      >
        <div class="card-preview">
          <svg
            :width="280"
            :height="187"
            viewBox="0 0 900 600"
            class="preview-svg"
          >
            <rect width="900" height="600" fill="#fafafa"/>

            <g v-for="building in snapshot.buildings" :key="building.id">
              <polygon
                :points="buildingPointsToString(building.points)"
                fill="#e3f2fd"
                stroke="#1976d2"
                stroke-width="3"
              />
            </g>

            <circle
              :cx="snapshot.blastCenter.x"
              :cy="snapshot.blastCenter.y"
              r="80"
              fill="rgba(244, 67, 54, 0.1)"
              stroke="#f44336"
              stroke-width="2"
              stroke-dasharray="5,5"
            />
            <circle
              :cx="snapshot.blastCenter.x"
              :cy="snapshot.blastCenter.y"
              r="15"
              fill="#f44336"
            />

            <g v-for="(point, index) in snapshot.points" :key="point.id">
              <circle
                :cx="point.x"
                :cy="point.y"
                r="20"
                fill="#4caf50"
                stroke="white"
                stroke-width="3"
              />
              <text
                :x="point.x"
                :y="point.y + 5"
                text-anchor="middle"
                fill="white"
                font-size="16"
                font-weight="bold"
              >{{ index + 1 }}</text>
            </g>
          </svg>
        </div>
        <div class="card-info">
          <div class="card-header">
            <span class="snapshot-id">#{{ snapshot.id.slice(0, 8) }}</span>
            <span :class="['status-badge', snapshot.validation.isValid ? 'status-valid' : 'status-invalid']">
              {{ snapshot.validation.isValid ? '合规' : '违规' }}
            </span>
          </div>
          <div class="card-meta">
            <div class="meta-item">
              <span class="meta-label">监测点:</span>
              <span class="meta-value">{{ snapshot.points.length }} 个</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">创建时间:</span>
              <span class="meta-value">{{ formatDate(snapshot.createdAt) }}</span>
            </div>
          </div>
          <div class="card-actions">
            <button class="btn btn-outline btn-sm" @click.stop="viewSnapshot(snapshot.id)">
              查看详情
            </button>
            <button class="btn btn-danger btn-sm" @click.stop="deleteSnapshot(snapshot.id)">
              删除
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../services/api'
import { syncSnapshots } from '../utils/storage'

const router = useRouter()
const snapshots = ref([])
const isLoading = ref(false)

onMounted(() => {
  loadSnapshots()
})

async function loadSnapshots() {
  isLoading.value = true
  try {
    const data = await api.getSnapshots()
    snapshots.value = data
    syncSnapshots(data)
  } catch (err) {
    console.error('加载快照列表失败:', err)
  } finally {
    isLoading.value = false
  }
}

function buildingPointsToString(points) {
  return points.map(p => `${p.x},${p.y}`).join(' ')
}

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function viewSnapshot(id) {
  router.push(`/snapshots/${id}`)
}

function goToLayout() {
  router.push('/')
}

async function deleteSnapshot(id) {
  if (!confirm('确定要删除这个快照吗？')) return

  try {
    await api.deleteSnapshot(id)
    snapshots.value = snapshots.value.filter(s => s.id !== id)
  } catch (err) {
    console.error('删除失败:', err)
    alert('删除失败: ' + err.message)
  }
}
</script>

<style scoped>
.snapshots-view {
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

.page-title {
  margin: 0;
  font-size: 22px;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.loading-state, .empty-state {
  background: white;
  border-radius: 8px;
  padding: 60px 24px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: #333;
}

.empty-state p {
  color: #666;
  margin: 0 0 24px 0;
}

.snapshots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.snapshot-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
}

.snapshot-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.card-preview {
  background: #f5f5f5;
  padding: 12px;
  display: flex;
  justify-content: center;
}

.preview-svg {
  border: 1px solid #ddd;
  border-radius: 4px;
}

.card-info {
  padding: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.snapshot-id {
  font-family: monospace;
  font-size: 14px;
  color: #666;
  background: #f5f5f5;
  padding: 4px 8px;
  border-radius: 4px;
}

.card-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.meta-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.meta-label {
  color: #888;
}

.meta-value {
  color: #333;
  font-weight: 500;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
}
</style>
