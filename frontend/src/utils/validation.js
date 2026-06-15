export const RULES = {
  MIN_DISTANCE_TO_BLAST: 80,
  MIN_DISTANCE_BETWEEN_POINTS: 60,
  BUFFER_ZONE_TO_BUILDING: 40,
  MAX_POINTS: 6
}

export function distance(p1, p2) {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
}

export function pointToPolygonDistance(point, polygon) {
  let minDist = Infinity
  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[i]
    const p2 = polygon[(i + 1) % polygon.length]
    const dist = pointToSegmentDistance(point, p1, p2)
    if (dist < minDist) minDist = dist
  }
  return minDist
}

export function pointToSegmentDistance(point, segStart, segEnd) {
  const A = point.x - segStart.x
  const B = point.y - segStart.y
  const C = segEnd.x - segStart.x
  const D = segEnd.y - segStart.y

  const dot = A * C + B * D
  const lenSq = C * C + D * D
  let param = -1

  if (lenSq !== 0) param = dot / lenSq

  let xx, yy

  if (param < 0) {
    xx = segStart.x
    yy = segStart.y
  } else if (param > 1) {
    xx = segEnd.x
    yy = segEnd.y
  } else {
    xx = segStart.x + param * C
    yy = segStart.y + param * D
  }

  return distance(point, { x: xx, y: yy })
}

export function validatePoints(points, blastCenter, buildings) {
  const violations = []
  const pointViolations = {}

  if (points.length > RULES.MAX_POINTS) {
    violations.push({
      pointId: null,
      pointIndex: null,
      type: 'max_points',
      message: `监测点数量不能超过 ${RULES.MAX_POINTS} 个，当前 ${points.length} 个`
    })
  }

  points.forEach((point, index) => {
    if (!pointViolations[point.id]) pointViolations[point.id] = []

    if (!point.instrumentNo || point.instrumentNo.trim() === '') {
      const violation = {
        pointId: point.id,
        pointIndex: index + 1,
        type: 'instrument_required',
        message: `${index + 1}号点仪器编号不能为空`
      }
      violations.push(violation)
      pointViolations[point.id].push(violation)
    }

    const distToBlast = distance(point, blastCenter)
    if (distToBlast < RULES.MIN_DISTANCE_TO_BLAST) {
      const violation = {
        pointId: point.id,
        pointIndex: index + 1,
        type: 'blast_distance',
        message: `距爆心 ${distToBlast.toFixed(1)}px，小于最小要求 ${RULES.MIN_DISTANCE_TO_BLAST}px`
      }
      violations.push(violation)
      pointViolations[point.id].push(violation)
    }

    for (let j = index + 1; j < points.length; j++) {
      const otherPoint = points[j]
      const distBetween = distance(point, otherPoint)
      if (distBetween < RULES.MIN_DISTANCE_BETWEEN_POINTS) {
        const violation1 = {
          pointId: point.id,
          pointIndex: index + 1,
          type: 'point_distance',
          relatedPointId: otherPoint.id,
          relatedPointIndex: j + 1,
          message: `与${j + 1}号点间距 ${distBetween.toFixed(1)}px，小于最小要求 ${RULES.MIN_DISTANCE_BETWEEN_POINTS}px`
        }
        const violation2 = {
          pointId: otherPoint.id,
          pointIndex: j + 1,
          type: 'point_distance',
          relatedPointId: point.id,
          relatedPointIndex: index + 1,
          message: `与${index + 1}号点间距 ${distBetween.toFixed(1)}px，小于最小要求 ${RULES.MIN_DISTANCE_BETWEEN_POINTS}px`
        }
        if (!pointViolations[point.id]) pointViolations[point.id] = []
        if (!pointViolations[otherPoint.id]) pointViolations[otherPoint.id] = []
        violations.push(violation1, violation2)
        pointViolations[point.id].push(violation1)
        pointViolations[otherPoint.id].push(violation2)
      }
    }
  })

  let hasBufferZonePoint = false
  points.forEach((point) => {
    let minBuildingDist = Infinity
    for (const building of buildings) {
      const dist = pointToPolygonDistance(point, building.points)
      if (dist < minBuildingDist) minBuildingDist = dist
    }
    if (minBuildingDist <= RULES.BUFFER_ZONE_TO_BUILDING) {
      hasBufferZonePoint = true
    }
  })

  if (!hasBufferZonePoint && points.length > 0) {
    const violation = {
      pointId: null,
      pointIndex: null,
      type: 'buffer_zone',
      message: `至少需要1个监测点落在距建筑轮廓 ≤ ${RULES.BUFFER_ZONE_TO_BUILDING}px 的缓冲带内`
    }
    violations.push(violation)
  }

  return {
    isValid: violations.length === 0,
    violations,
    pointViolations,
    rules: RULES
  }
}
