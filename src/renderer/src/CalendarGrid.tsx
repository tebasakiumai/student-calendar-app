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
}

const weekdays = ['日', '月', '火', '水', '木', '金', '土']

export function CalendarGrid({
  year,
  month,
  events,
  layers,
  onDateDoubleClick
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
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2px' }}>
              {eventsOnThisDay.map((event) => (
                <span
                  key={event.id}
                  title={event.title}
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: getLayerColor(event.layerId, layers)
                  }}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}