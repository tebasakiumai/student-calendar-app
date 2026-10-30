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

  const eventsOnThisDay = events.filter(
    (event) => event.dueDate <= date && date <= (event.endDate ?? event.dueDate)
  )
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
                const lastDate = event.endDate ?? event.dueDate
                const isMultiDay = lastDate > event.dueDate

                let startHour = h + m / 60
                let endHourValue = startHour + 0.5 // 終了時刻なしなら30分幅

                if (event.endTime) {
                  const [eh, em] = event.endTime.split(':').map(Number)
                  endHourValue = eh + em / 60
                }

                if (isMultiDay) {
                  if (date === event.dueDate) {
                    endHourValue = 24 // 開始日：開始時刻〜24時
                  } else if (date === lastDate) {
                    startHour = 0 // 最終日：0時〜終了時刻
                    if (!event.endTime) endHourValue = 24
                  } else {
                    startHour = 0 // 途中の日：0時〜24時
                    endHourValue = 24
                  }
                } else if (endHourValue <= startHour) {
                  endHourValue = startHour + 0.5
                }

                const startRatio = startHour / totalHours
                const widthRatio = Math.max((endHourValue - startHour) / totalHours, 0.5 / totalHours)

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