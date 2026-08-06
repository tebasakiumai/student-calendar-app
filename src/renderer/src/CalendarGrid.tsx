export interface CalendarEvent {
  id: string
  title: string
  layer: 'job-hunting' | 'school' | 'hobby'
  dueDate: string
  link?: string
}

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

// DateをYYYY-MM-DD形式の文字列に変換（dueDateと比較するため）
function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const layerColors: Record<CalendarEvent['layer'], string> = {
  'job-hunting': '#7F77DD',
  school: '#1D9E75',
  hobby: '#E07A4E'
}

interface CalendarGridProps {
  year: number
  month: number // 0始まり（0=1月）
  events: CalendarEvent[]
}

const weekdays = ['日', '月', '火', '水', '木', '金', '土']

export function CalendarGrid({ year, month, events }: CalendarGridProps): JSX.Element {
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
            style={{
              textAlign: 'center',
              padding: '8px',
              color: isCurrentMonth ? 'inherit' : '#888',
              border: '1px solid #eee'
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
                    backgroundColor: layerColors[event.layer]
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