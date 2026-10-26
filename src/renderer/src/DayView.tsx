import { CalendarEvent, Layer } from './types'
import React, { useLayoutEffect, useRef } from 'react'

interface DayViewProps {
  date: string | null
  events: CalendarEvent[]
  layers: Layer[]
  onEventClick: (event: CalendarEvent) => void
}

const totalHours = 24
const initialHour = 8

function getLayerColor(layerId: string, layers: Layer[]): string {
  const layer = layers.find((l) => l.id === layerId)
  return layer ? layer.color : '#ccc'
}

export function DayView({ date, events, layers, onEventClick }: DayViewProps): React.ReactElement {
  const viewportRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const dragStartX = useRef(0)
  const dragStartScrollLeft = useRef(0)

  useLayoutEffect(() => {
    const el = viewportRef.current
    if (!el) return
    el.scrollLeft = el.scrollWidth * (initialHour / totalHours)
  }, [date])

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>): void {
    const el = viewportRef.current
    if (!el) return
    isDragging.current = true
    dragStartX.current = e.clientX
    dragStartScrollLeft.current = el.scrollLeft
    el.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>): void {
    const el = viewportRef.current
    if (!el || !isDragging.current) return
    const movedBy = e.clientX - dragStartX.current
    el.scrollLeft = dragStartScrollLeft.current - movedBy
  }

  function handlePointerUp(): void {
    isDragging.current = false
  }

  if (!date) {
    return (
      <p className="dayview-empty">カレンダーの日付をクリックすると、その日の予定が表示されます</p>
    )
  }

  const eventsOnThisDay = events.filter((event) => event.dueDate === date)
  const allDayEvents = eventsOnThisDay.filter((event) => event.isAllDay)
  const timedEvents = eventsOnThisDay.filter((event) => !event.isAllDay && event.time)

  const hourMarks = Array.from({ length: totalHours + 1 }, (_, i) => i)

  return (
    <div className="dayview">
      <div className="dayview-header">
        <span className="dayview-date">{date}</span>
        {allDayEvents.map((event) => (
          <div
            key={event.id}
            className="event-chip"
            style={{ backgroundColor: getLayerColor(event.layerId, layers) }}
            onClick={() => onEventClick(event)}
          >
            {event.title}
          </div>
        ))}
      </div>

      <div
        className="dayview-scroll-viewport"
        ref={viewportRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div className="dayview-scroll-inner">
          <div className="dayview-hourline-row">
            {hourMarks.map((hour) => (
              <span
                key={hour}
                className="dayview-hourmark"
                style={{ left: `${(hour / totalHours) * 100}%` }}
              >
                {hour}
              </span>
            ))}
          </div>

          <div className="dayview-track">
            {hourMarks.map((hour) => (
              <div
                key={hour}
                className="dayview-gridline"
                style={{ left: `${(hour / totalHours) * 100}%` }}
              />
            ))}

            {timedEvents.map((event) => {
                const [h, m] = (event.time ?? '0:0').split(':').map(Number)
                const startRatio = (h + m / 60) / totalHours

                let widthRatio = 1 / totalHours / 2 // 終了時刻がなければ30分幅
                if (event.endTime) {
                  const [eh, em] = event.endTime.split(':').map(Number)
                  const durationHours = eh + em / 60 - (h + m / 60)
                  if (durationHours > 0) {
                    widthRatio = durationHours / totalHours
                  }
                }

                return (
                    <div
                    key={event.id}
                    className="dayview-event"
                    title={event.title}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.stopPropagation()
                        onEventClick(event)
                    }}
                    style={{
                        left: `${startRatio * 100}%`,
                        width: `${widthRatio * 100}%`,
                        backgroundColor: getLayerColor(event.layerId, layers)
                    }}
                    >
                    {event.time}
                    {event.endTime ? `〜${event.endTime}` : ''} {event.title}
                    </div>
                )
                })}
          </div>
        </div>
      </div>
    </div>
  )
}