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

interface CalendarGridProps {
  year: number
  month: number // 0始まり（0=1月）
}

const weekdays = ['日', '月', '火', '水', '木', '金', '土']

export function CalendarGrid({ year, month }: CalendarGridProps): JSX.Element {
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
        return (
          <div
            key={date.toISOString()}
            style={{
              textAlign: 'center',
              padding: '8px',
              color: isCurrentMonth ? 'inherit' : '#888',
              border: '1px solid #eee'
            }}
          >
            {date.getDate()}
          </div>
        )
      })}
    </div>
  )
}
