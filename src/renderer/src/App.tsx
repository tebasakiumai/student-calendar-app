import { isWithinInterval, addDays, startOfToday } from 'date-fns'
import { CalendarGrid } from './CalendarGrid'
import { CalendarEvent, Layer, defaultLayers } from './types'
import { useState, useEffect } from 'react'

const dummyEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'ES提出：〇〇商事',
    layerId: 'l1',
    dueDate: '2026-08-07',
    hasDeadline: true,
    isAllDay: true,
    link: 'https://example.com',
    status: '未着手'
  },
  {
    id: '2',
    title: 'レポート提出：経済学演習',
    layerId: 'l2',
    dueDate: '2026-08-08',
    hasDeadline: true,
    isAllDay: false,
    time: '18:00',
    status: '進行中'
  },
  {
    id: '3',
    title: 'Webテスト：△△製作所',
    layerId: 'l1',
    dueDate: '2026-08-10',
    hasDeadline: true,
    isAllDay: true,
    link: 'https://example.com',
    status: '未着手'
  }
]

const colorPalette = ['#7F77DD', '#1D9E75', '#E07A4E', '#D65C7D', '#3B8FD6', '#C9A227']

function App(): JSX.Element {
  const [layers, setLayers] = useState<Layer[]>(defaultLayers)
  const [events, setEvents] = useState<CalendarEvent[]>(dummyEvents)
  const [selectedLayerId, setSelectedLayerId] = useState<string | 'all'>('all')
  const [newLayerName, setNewLayerName] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)

  // ↓ここに追加
  useEffect(() => {
    window.api.loadData().then((saved) => {
      if (saved) {
        const data = saved as { layers: Layer[]; events: CalendarEvent[] }
        setLayers(data.layers)
        setEvents(data.events)
      }
      setIsLoaded(true)
    })
  }, [])
  // ↑ここまで

  useEffect(() => {
    if (!isLoaded) return
    window.api.saveData({ layers, events })
  }, [layers, events, isLoaded])

  const filteredEvents =
  selectedLayerId === 'all'
    ? events
    : events.filter((event) => event.layerId === selectedLayerId)

  const today = startOfToday()
  const oneWeekLater = addDays(today, 7)

  const weeklyDeadlines = filteredEvents.filter((event) => {
    const due = new Date(event.dueDate)
    return isWithinInterval(due, { start: today, end: oneWeekLater })
  })

  function handleAddLayer(): void {
    if (newLayerName.trim() === '') return

    const newLayer: Layer = {
      id: crypto.randomUUID(),
      name: newLayerName,
      color: colorPalette[layers.length % colorPalette.length]
    }

    setLayers([...layers, newLayer])
    setNewLayerName('')
  }

  return (
    <div>
      <h1>就活カレンダー</h1>

      <div>
        <button onClick={() => setSelectedLayerId('all')}>すべて</button>
        {layers.map((layer) => (
          <button
            key={layer.id}
            onClick={() => setSelectedLayerId(layer.id)}
            style={{
              backgroundColor: layer.color,
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 10px',
              marginLeft: '4px'
            }}
          >
            {layer.name}
          </button>
        ))}
      </div>

      <div>
        <input
          type="text"
          value={newLayerName}
          onChange={(e) => setNewLayerName(e.target.value)}
          placeholder="新しいレイヤー名"
        />
        <button onClick={handleAddLayer}>＋レイヤー追加</button>
      </div>

      <h2>今週の締め切り</h2>
      <ul>
        {weeklyDeadlines.map((event) => (
          <li key={event.id}>
            {event.title}（{event.dueDate}
            {event.isAllDay ? '' : ` ${event.time}`}）　ステータス: {event.status}
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

      <h2>2026年8月</h2>
      <CalendarGrid year={2026} month={7} events={filteredEvents} layers={layers} />
    </div>
  )
}

export default App