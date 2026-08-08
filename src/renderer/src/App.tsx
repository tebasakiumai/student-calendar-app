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

  const [newTitle, setNewTitle] = useState('')
  const [newEventLayerId, setNewEventLayerId] = useState('l1')
  const [newMemo, setNewMemo] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [newHasDeadline, setNewHasDeadline] = useState(true)
  const [newIsAllDay, setNewIsAllDay] = useState(true)
  const [newTime, setNewTime] = useState('')
  const [newLink, setNewLink] = useState('')

  const [isFormOpen, setIsFormOpen] = useState(false)

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

  function handleAddEvent(): void {
    if (newTitle.trim() === '' || newDueDate === '') return

    const newEvent: CalendarEvent = {
      id: crypto.randomUUID(),
      title: newTitle,
      layerId: newEventLayerId,
      memo: newMemo || undefined,
      dueDate: newDueDate,
      hasDeadline: newHasDeadline,
      isAllDay: newIsAllDay,
      time: newIsAllDay ? undefined : newTime,
      link: newLink || undefined,
      status: '未着手'
    }

    setEvents([...events, newEvent])

    // 入力欄をリセット
    setNewTitle('')
    setNewMemo('')
    setNewDueDate('')
    setNewTime('')
    setNewLink('')

    setIsFormOpen(false)
  }

  function handleDeleteEvent(id: string): void {
    setEvents(events.filter((event) => event.id !== id))
  }

  function handleStatusChange(id: string, status: CalendarEvent['status']): void {
    setEvents(
      events.map((event) => (event.id === id ? { ...event, status } : event))
    )
  }

  function handleDeleteLayer(id: string): void {
    const hasEvents = events.some((event) => event.layerId === id)
    if (hasEvents) {
      const confirmed = window.confirm(
        'このレイヤーに含まれる予定も一緒に削除されます。よろしいですか？'
      )
      if (!confirmed) return
    }

    setLayers(layers.filter((layer) => layer.id !== id))
    setEvents(events.filter((event) => event.layerId !== id))
  }

  function handleRenameLayer(id: string, name: string): void {
    setLayers(
      layers.map((layer) => (layer.id === id ? { ...layer, name } : layer))
    )
  }

  return (
    <div>
      <h1>就活カレンダー</h1>

      <div>
        <button onClick={() => setSelectedLayerId('all')}>すべて</button>
        {layers.map((layer) => (
          <span key={layer.id} style={{ marginLeft: '4px' }}>
            <button
              onClick={() => setSelectedLayerId(layer.id)}
              style={{
                backgroundColor: layer.color,
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 10px'
              }}
            >
              {layer.name}
            </button>
            <button onClick={() => handleDeleteLayer(layer.id)}>×</button>
          </span>
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
      
      <div style={{ border: '1px solid #ccc', padding: '12px', marginTop: '12px' }}>
        <button onClick={() => setIsFormOpen(!isFormOpen)}>
          {isFormOpen ? '▼ 予定を追加' : '▶ 予定を追加'}
        </button>

        {isFormOpen && (
          <>
            <div>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="タイトル"
              />
            </div>

            <div>
              <select value={newEventLayerId} onChange={(e) => setNewEventLayerId(e.target.value)}>
                {layers.map((layer) => (
                  <option key={layer.id} value={layer.id}>
                    {layer.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <textarea
                value={newMemo}
                onChange={(e) => setNewMemo(e.target.value)}
                placeholder="メモ"
              />
            </div>

            <div>
              <label>
                <input
                  type="checkbox"
                  checked={newHasDeadline}
                  onChange={(e) => setNewHasDeadline(e.target.checked)}
                />
                期限付き
              </label>
            </div>

            <div>
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
              />
            </div>

            <div>
              <label>
                <input
                  type="checkbox"
                  checked={newIsAllDay}
                  onChange={(e) => setNewIsAllDay(e.target.checked)}
                />
                終日
              </label>
              {!newIsAllDay && (
                <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
              )}
            </div>

            <div>
              <input
                type="text"
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                placeholder="提出先リンク"
              />
            </div>

            <button onClick={handleAddEvent}>予定を追加</button>
          </>
        )}
      </div>

      <h2>今週の締め切り</h2>
      <ul>
        {weeklyDeadlines.map((event) => (
          <li key={event.id}>
            {event.title}（{event.dueDate}
            {event.isAllDay ? '' : ` ${event.time}`}）
            <select
              value={event.status}
              onChange={(e) =>
                handleStatusChange(event.id, e.target.value as CalendarEvent['status'])
              }
            >
              <option value="未着手">未着手</option>
              <option value="進行中">進行中</option>
              <option value="完了">完了</option>
            </select>
            {event.link && (
              <>
                {' '}
                <a href={event.link} target="_blank" rel="noreferrer">
                  提出先
                </a>
              </>
            )}
            <button onClick={() => handleDeleteEvent(event.id)}>削除</button>
          </li>
        ))}
      </ul>

      <h2>2026年8月</h2>
      <CalendarGrid year={2026} month={7} events={filteredEvents} layers={layers} />
    </div>
  )
}

export default App