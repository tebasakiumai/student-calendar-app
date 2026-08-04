import { useState } from 'react'
interface CalendarEvent {
  id: string
  title: string
  layer: 'job-hunting' | 'school' | 'hobby'
  dueDate: string
  link?: string
}

const dummyEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'ES提出：〇〇商事',
    layer: 'job-hunting',
    dueDate: '2026-08-05',
    link: 'https://example.com'
  },
  {
    id: '2',
    title: 'レポート提出：経済学演習',
    layer: 'school',
    dueDate: '2026-08-06'
  },
  {
    id: '3',
    title: 'Webテスト：△△製作所',
    layer: 'job-hunting',
    dueDate: '2026-08-08',
    link: 'https://example.com'
  }
]
function App(): JSX.Element {
  const [selectedLayer, setSelectedLayer] = useState<'all' | 'job-hunting' | 'school' | 'hobby'>('all')

  const filteredEvents =
    selectedLayer === 'all'
      ? dummyEvents
      : dummyEvents.filter((event) => event.layer === selectedLayer)

  return (
    <div>
      <h1>就活カレンダー</h1>

      <div>
        <button onClick={() => setSelectedLayer('all')}>すべて</button>
        <button onClick={() => setSelectedLayer('job-hunting')}>就活</button>
        <button onClick={() => setSelectedLayer('school')}>学校</button>
        <button onClick={() => setSelectedLayer('hobby')}>趣味</button>
      </div>

      <h2>今週の締め切り</h2>
      <ul>
        {filteredEvents.map((event) => (
          <li key={event.id}>
            {event.title}（{event.dueDate}）
            {event.link && (
              <>
                {' '}
                <a href={event.link} target="_blank" rel="noreferrer">
                  提出先
                </a>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App
