import { createRouter, createWebHistory } from 'vue-router'
import LayoutView from '../views/LayoutView.vue'
import SnapshotsView from '../views/SnapshotsView.vue'
import SnapshotDetailView from '../views/SnapshotDetailView.vue'

const routes = [
  {
    path: '/',
    name: 'layout',
    component: LayoutView
  },
  {
    path: '/snapshots',
    name: 'snapshots',
    component: SnapshotsView
  },
  {
    path: '/snapshots/:id',
    name: 'snapshot-detail',
    component: SnapshotDetailView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
