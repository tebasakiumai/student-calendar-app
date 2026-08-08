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

  const [isLayerModalOpen, setIsLayerModalOpen] = useState(false)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

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

  function handleDateDoubleClick(dateStr: string): void {
    setEditingEventId(null)
    setNewTitle('')
    setNewEventLayerId(layers[0]?.id ?? '')
    setNewMemo('')
    setNewDueDate(dateStr)
    setNewHasDeadline(true)
    setNewIsAllDay(true)
    setNewTime('')
    setNewLink('')
    setIsEventModalOpen(true)
  }

  function handleEditEvent(event: CalendarEvent): void {
    setEditingEventId(event.id)
    setNewTitle(event.title)
    setNewEventLayerId(event.layerId)
    setNewMemo(event.memo ?? '')
    setNewDueDate(event.dueDate)
    setNewHasDeadline(event.hasDeadline)
    setNewIsAllDay(event.isAllDay)
    setNewTime(event.time ?? '')
    setNewLink(event.link ?? '')
    setIsEventModalOpen(true)
  }

  function handleAddEvent(): void {
    if (newTitle.trim() === '' || newDueDate === '') return

    if (editingEventId) {
      // 編集モード：既存の予定を更新
      setEvents(
        events.map((event) =>
          event.id === editingEventId
            ? {
                ...event,
                title: newTitle,
                layerId: newEventLayerId,
                memo: newMemo || undefined,
                dueDate: newDueDate,
                hasDeadline: newHasDeadline,
                isAllDay: newIsAllDay,
                time: newIsAllDay ? undefined : newTime,
                link: newLink || undefined
              }
            : event
        )
      )
    } else {
      // 新規追加モード
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
    }

    setNewTitle('')
    setNewMemo('')
    setNewDueDate('')
    setNewTime('')
    setNewLink('')
    setEditingEventId(null)
    setIsEventModalOpen(false)
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

  function handleChangeLayerColor(id: string, color: string): void {
    setLayers(layers.map((layer) => (layer.id === id ? { ...layer, color } : layer)))
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '260px 1fr 300px',
        gridTemplateRows: '60px 1fr',
        gridTemplateAreas: `
          "header tabs addbtn"
          "deadlines calendar detail"
        `,
        height: '100vh',
        gap: '8px',
        padding: '8px',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ gridArea: 'header', display: 'flex', alignItems: 'center' }}>
        <h1 style={{ fontSize: '18px', margin: 0 }}>就活カレンダー</h1>
      </div>

      <div style={{ gridArea: 'tabs', display: 'flex', alignItems: 'center', gap: '4px' }}>
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
              padding: '4px 10px'
            }}
          >
            {layer.name}
          </button>
        ))}
        <button onClick={() => setIsLayerModalOpen(true)}>⚙</button>
      </div>

      <div style={{ gridArea: 'addbtn', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <button
          onClick={() => {
            setEditingEventId(null)
            setNewTitle('')
            setNewEventLayerId(layers[0]?.id ?? '')
            setNewMemo('')
            setNewDueDate('')
            setNewHasDeadline(true)
            setNewIsAllDay(true)
            setNewTime('')
            setNewLink('')
            setIsEventModalOpen(true)
          }}
        >
          ＋ 予定を追加
        </button>
      </div>

      <div style={{ gridArea: 'deadlines', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '14px' }}>今週の締め切り</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {weeklyDeadlines.map((event) => (
            <li
              key={event.id}
              onClick={() => setSelectedEventId(event.id)}
              style={{
                borderLeft: `4px solid ${layers.find((l) => l.id === event.layerId)?.color ?? '#ccc'}`,
                padding: '6px 8px',
                marginBottom: '6px',
                cursor: 'pointer',
                backgroundColor: selectedEventId === event.id ? '#eee' : 'transparent'
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 500 }}>{event.title}</div>
              <div style={{ fontSize: '11px', color: '#888' }}>
                {event.dueDate}
                {event.isAllDay ? '' : ` ${event.time}`}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div style={{ gridArea: 'calendar', overflowY: 'auto' }}>
        <CalendarGrid
          year={2026}
          month={7}
          events={filteredEvents}
          layers={layers}
          onDateDoubleClick={handleDateDoubleClick}
          onEventClick={(event) => setSelectedEventId(event.id)}
        />
      </div>

      <div style={{ gridArea: 'detail', overflowY: 'auto', borderLeft: '1px solid #ccc', paddingLeft: '8px' }}>
        {(() => {
          const selectedEvent = events.find((event) => event.id === selectedEventId)

          if (!selectedEvent) {
            return <p style={{ color: '#888', fontSize: '13px' }}>予定を選択してください</p>
          }

          const layer = layers.find((l) => l.id === selectedEvent.layerId)

          return (
            <div>
              <div
                style={{
                  display: 'inline-block',
                  backgroundColor: layer?.color ?? '#ccc',
                  color: 'white',
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  marginBottom: '8px'
                }}
              >
                {layer?.name ?? '不明'}
              </div>

              <h3 style={{ margin: '4px 0' }}>{selectedEvent.title}</h3>

              <p style={{ fontSize: '13px', color: '#555' }}>
                {selectedEvent.hasDeadline ? '期限' : '日付'}: {selectedEvent.dueDate}
                {selectedEvent.isAllDay ? '（終日）' : ` ${selectedEvent.time}`}
              </p>

              {selectedEvent.memo && (
                <p style={{ fontSize: '13px', whiteSpace: 'pre-wrap' }}>{selectedEvent.memo}</p>
              )}

              {selectedEvent.link && (
                <p>
                  <a href={selectedEvent.link} target="_blank" rel="noreferrer">
                    提出先リンク
                  </a>
                </p>
              )}

              <div style={{ margin: '8px 0' }}>
                <label style={{ fontSize: '13px' }}>ステータス：</label>
                <select
                  value={selectedEvent.status}
                  onChange={(e) =>
                    handleStatusChange(selectedEvent.id, e.target.value as CalendarEvent['status'])
                  }
                >
                  <option value="未着手">未着手</option>
                  <option value="進行中">進行中</option>
                  <option value="完了">完了</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button onClick={() => handleEditEvent(selectedEvent)}>編集</button>
                <button
                  onClick={() => {
                    handleDeleteEvent(selectedEvent.id)
                    setSelectedEventId(null)
                  }}
                >
                  削除
                </button>
              </div>
            </div>
          )
        })()}
      </div>

      {isEventModalOpen && (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
        onClick={() => setIsEventModalOpen(false)}
      >
        <div
          style={{
            backgroundColor: 'white',
            color: 'black',
            padding: '20px',
            borderRadius: '8px',
            width: '400px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2>{editingEventId ? '予定を編集' : '予定を追加'}</h2>

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
            <input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} />
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

          <div style={{ marginTop: '12px' }}>
            <button onClick={handleAddEvent}>{editingEventId ? '更新する' : '追加する'}</button>
            <button onClick={() => setIsEventModalOpen(false)}>キャンセル</button>
          </div>
        </div>
      </div>
    )}

    {isLayerModalOpen && (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
        onClick={() => setIsLayerModalOpen(false)}
      >
        <div
          style={{
            backgroundColor: 'white',
            color: 'black',
            padding: '20px',
            borderRadius: '8px',
            width: '400px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2>レイヤー管理</h2>

          {layers.map((layer) => (
            <div
              key={layer.id}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}
            >
              <input
                type="text"
                value={layer.name}
                onChange={(e) => handleRenameLayer(layer.id, e.target.value)}
              />
              {colorPalette.map((color) => (
                <button
                  key={color}
                  onClick={() => handleChangeLayerColor(layer.id, color)}
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: color,
                    border: layer.color === color ? '2px solid black' : 'none',
                    padding: 0
                  }}
                />
              ))}
              <button onClick={() => handleDeleteLayer(layer.id)}>削除</button>
            </div>
          ))}

          <hr />

          <div>
            <input
              type="text"
              value={newLayerName}
              onChange={(e) => setNewLayerName(e.target.value)}
              placeholder="新しいレイヤー名"
            />
            <button onClick={handleAddLayer}>＋追加</button>
          </div>

          <button onClick={() => setIsLayerModalOpen(false)} style={{ marginTop: '12px' }}>
            閉じる
          </button>
        </div>
      </div>
    )}
    </div>
  )
}

export default App