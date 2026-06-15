const express = require('express')
const fs = require('fs')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const { validatePoints } = require('../utils/validation')

const router = express.Router()
const DATA_FILE = path.join(__dirname, '..', 'data', 'snapshots.json')

function ensureDataFile() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true })
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2))
  }
}

function readSnapshots() {
  ensureDataFile()
  const data = fs.readFileSync(DATA_FILE, 'utf8')
  return JSON.parse(data)
}

function writeSnapshots(snapshots) {
  ensureDataFile()
  fs.writeFileSync(DATA_FILE, JSON.stringify(snapshots, null, 2))
}

router.get('/', (req, res) => {
  try {
    const snapshots = readSnapshots()
    res.json(snapshots)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', (req, res) => {
  try {
    const snapshots = readSnapshots()
    const snapshot = snapshots.find(s => s.id === req.params.id)
    if (!snapshot) {
      return res.status(404).json({ error: '快照不存在' })
    }
    res.json(snapshot)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', (req, res) => {
  try {
    const { points, blastCenter, buildings, canvasSize } = req.body

    if (!points || !Array.isArray(points)) {
      return res.status(400).json({ error: '点位数据无效' })
    }

    if (points.length === 0) {
      return res.status(400).json({ error: '至少需要布设1个监测点' })
    }

    if (points.length > 6) {
      return res.status(400).json({ error: `监测点数量不能超过 ${6} 个，当前提交了 ${points.length} 个` })
    }

    for (let i = 0; i < points.length; i++) {
      const p = points[i]
      if (!p.instrumentNo || typeof p.instrumentNo !== 'string' || p.instrumentNo.trim() === '') {
        return res.status(400).json({ error: `第 ${i + 1} 号监测点仪器编号不能为空` })
      }
    }

    const validation = validatePoints(points, blastCenter, buildings)
    if (!validation.isValid) {
      return res.status(400).json({
        error: '布设不符合规范',
        validation
      })
    }

    const snapshot = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      points,
      blastCenter,
      buildings,
      canvasSize,
      validation
    }

    const snapshots = readSnapshots()
    snapshots.unshift(snapshot)
    writeSnapshots(snapshots)

    res.status(201).json(snapshot)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/validate', (req, res) => {
  try {
    const { points, blastCenter, buildings } = req.body

    if (!points || !Array.isArray(points)) {
      return res.status(400).json({ error: '点位数据无效' })
    }

    if (points.length > 6) {
      return res.status(400).json({ error: `监测点数量不能超过 6 个` })
    }

    const validation = validatePoints(points, blastCenter, buildings)
    res.json(validation)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', (req, res) => {
  try {
    const snapshots = readSnapshots()
    const index = snapshots.findIndex(s => s.id === req.params.id)
    if (index === -1) {
      return res.status(404).json({ error: '快照不存在' })
    }
    snapshots.splice(index, 1)
    writeSnapshots(snapshots)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
