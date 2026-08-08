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
}

const weekdays = ['日', '月', '火', '水', '木', '金', '土']

export function CalendarGrid({
  year,
  month,
  events,
  layers,
  onDateDoubleClick,
  onEventClick
}: CalendarGridProps): JSX.Element {
  const days = getMonthDays(year, month)

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '4px'
      }}
    >
      {weekdays.map((day) => (
        <div key={day} style={{ textAlign: 'center', fontWeight: 'bold' }}>
          {day}
        </div>
      ))}

      {days.map((date) => {
        const isCurrentMonth = date.getMonth() === month
        const dateStr = formatDate(date)
        const eventsOnThisDay = events.filter((event) => event.dueDate === dateStr)

        return (
          <div
            key={dateStr}
            onDoubleClick={() => onDateDoubleClick(dateStr)}
            style={{
              textAlign: 'center',
              padding: '8px',
              minHeight: '60px',
              color: isCurrentMonth ? 'inherit' : '#888',
              border: '1px solid #eee',
              cursor: 'pointer'
            }}
          >
          <div>{date.getDate()}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
            {eventsOnThisDay.map((event) => (
              <div
                key={event.id}
                onClick={(e) => {
                  e.stopPropagation()
                  onEventClick(event)
                }}
                title={event.title}
                style={{
                  backgroundColor: getLayerColor(event.layerId, layers),
                  color: 'white',
                  fontSize: '10px',
                  padding: '2px 4px',
                  borderRadius: '3px',
                  textAlign: 'left',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  cursor: 'pointer'
                }}
              >
                {event.title}
              </div>
            ))}
          </div>
        </div>
        )
      })}
    </div>
  )
}