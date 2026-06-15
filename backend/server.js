const express = require('express')
const cors = require('cors')
const path = require('path')

const snapshotsRouter = require('./routes/snapshots')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.use('/api/snapshots', snapshotsRouter)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/api/config', (req, res) => {
  res.json({
    canvasSize: { width: 900, height: 600 },
    blastCenter: { x: 450, y: 300 },
    buildings: [
      {
        id: 'building-1',
        name: '办公楼',
        points: [
          { x: 100, y: 100 },
          { x: 200, y: 100 },
          { x: 200, y: 180 },
          { x: 100, y: 180 }
        ]
      },
      {
        id: 'building-2',
        name: '生产车间',
        points: [
          { x: 650, y: 120 },
          { x: 800, y: 120 },
          { x: 800, y: 220 },
          { x: 650, y: 220 }
        ]
      },
      {
        id: 'building-3',
        name: '仓库',
        points: [
          { x: 150, y: 400 },
          { x: 300, y: 400 },
          { x: 300, y: 500 },
          { x: 150, y: 500 }
        ]
      }
    ],
    rules: {
      MIN_DISTANCE_TO_BLAST: 80,
      MIN_DISTANCE_BETWEEN_POINTS: 60,
      BUFFER_ZONE_TO_BUILDING: 40,
      MAX_POINTS: 6
    }
  })
})

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`)
})
