import { CalendarEvent, Layer } from './types'

export function getMonthDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - startDate.getDay())

  const endDate = new Date(lastDay)
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()))

  const days: Date[] = []
  const current = new Date(startDate)
  while (current <= endDate) {
    days.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }

  return days
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getLayerColor(layerId: string, layers: Layer[]): string {
  const layer = layers.find((l) => l.id === layerId)
  return layer ? layer.color : '#ccc'
}

interface CalendarGridProps {
  year: number
  month: number
  events: CalendarEvent[]
  layers: Layer[]
  onDateDoubleClick: (dateStr: string) => void
  onEventClick: (event: CalendarEvent) => void
  onDateClick: (dateStr: string) => void
}

const weekdays = ['日', '月', '火', '水', '木', '金', '土']

export function CalendarGrid({
  year,
  month,
  events,
  layers,
  onDateDoubleClick,
  onDateClick,
  onEventClick
}: CalendarGridProps): JSX.Element {
  const days = getMonthDays(year, month)

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {weekdays.map((day) => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}
      </div>

      <div className="calendar-grid">
        {days.map((date) => {
          const isCurrentMonth = date.getMonth() === month
          const dateStr = formatDate(date)
          const eventsOnThisDay = events.filter((event) => event.dueDate === dateStr)

          return (
            <div
              key={dateStr}
              onClick={() => onDateClick(dateStr)}
              onDoubleClick={() => onDateDoubleClick(dateStr)}
              className={`calendar-cell${isCurrentMonth ? '' : ' is-other-month'}`}
            >
              <span className="calendar-date">{date.getDate()}</span>
              {eventsOnThisDay.map((event) => (
                <div
                  key={event.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    onEventClick(event)
                  }}
                  title={event.title}
                  className="event-chip"
                  style={{ backgroundColor: getLayerColor(event.layerId, layers) }}
                >
                  {event.title}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}