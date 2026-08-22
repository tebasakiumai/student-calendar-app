import {
  isWithinInterval,
  addDays,
  startOfToday,
  differenceInCalendarDays,
  eachDayOfInterval,
  format
} from 'date-fns'
import { CalendarGrid } from './CalendarGrid'
import { CalendarEvent, Layer, defaultLayers } from './types'
import React, { useState, useEffect } from 'react'
import { DayView } from './DayView'

const dummyEvents: CalendarEvent[] = []

const colorPalette = ['#7F77DD', '#1D9E75', '#E07A4E', '#D65C7D', '#3B8FD6', '#C9A227']

function App(): React.ReactElement {
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

  const [bulkMode, setBulkMode] = useState<'single' | 'range' | 'multiple' | 'recurring'>('single')
  const [newDueDateEnd, setNewDueDateEnd] = useState('')
  const [multipleDates, setMultipleDates] = useState<string[]>([])
  const [recurringWeekdays, setRecurringWeekdays] = useState<number[]>([])

  const [isLayerModalOpen, setIsLayerModalOpen] = useState(false)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null)

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
    setBulkMode('single')
    setNewDueDateEnd('')
    setMultipleDates([])
    setRecurringWeekdays([])
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
    setBulkMode('single')
    setNewDueDateEnd('')
    setMultipleDates([])
    setRecurringWeekdays([])
  }

  function handleAddDateToList(): void {
    if (newDueDate === '') return
    if (multipleDates.includes(newDueDate)) return
    setMultipleDates([...multipleDates, newDueDate].sort())
    setNewDueDate('')
  }

  function handleRemoveDateFromList(date: string): void {
    setMultipleDates(multipleDates.filter((d) => d !== date))
  }

  function toggleWeekday(day: number): void {
    setRecurringWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    )
  }

  function handleAddEvent(): void {
    if (newTitle.trim() === '') return

    if (editingEventId) {
      if (newDueDate === '') return
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
    } else if (bulkMode === 'recurring') {
      if (newDueDate === '' || recurringWeekdays.length === 0) return
        const rangeEnd = newDueDateEnd !== '' ? new Date(newDueDateEnd) : addDays(new Date(newDueDate), 180)
      if (newDueDateEnd !== '' && new Date(newDueDate) > new Date(newDueDateEnd)) return

      const dates = eachDayOfInterval({
        start: new Date(newDueDate),
        end: rangeEnd
      })
        .filter((d) => recurringWeekdays.includes(d.getDay()))
        .map((d) => format(d, 'yyyy-MM-dd'))

      const newEvents: CalendarEvent[] = dates.map((dateStr) => ({
        id: crypto.randomUUID(),
        title: newTitle,
        layerId: newEventLayerId,
        memo: newMemo || undefined,
        dueDate: dateStr,
        hasDeadline: newHasDeadline,
        isAllDay: newIsAllDay,
        time: newIsAllDay ? undefined : newTime,
        link: newLink || undefined,
        status: '未着手'
      }))

      setEvents([...events, ...newEvents])
    } else if (bulkMode === 'multiple') {
      if (multipleDates.length === 0) return

      const newEvents: CalendarEvent[] = multipleDates.map((dateStr) => ({
        id: crypto.randomUUID(),
        title: newTitle,
        layerId: newEventLayerId,
        memo: newMemo || undefined,
        dueDate: dateStr,
        hasDeadline: newHasDeadline,
        isAllDay: newIsAllDay,
        time: newIsAllDay ? undefined : newTime,
        link: newLink || undefined,
        status: '未着手'
      }))

      setEvents([...events, ...newEvents])
    } else {
      if (newDueDate === '') return
      // 通常の単体追加
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
    setNewDueDateEnd('')
    setMultipleDates([])
    setRecurringWeekdays([])
    setBulkMode('single')
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

  function handleDateClick(dateStr: string): void {
    setSelectedDayDate(dateStr)

    const hasEventsOnThisDay = events.some((event) => event.dueDate === dateStr)
    if (!hasEventsOnThisDay) {
      setSelectedEventId(null)
    }
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: selectedEventId ? '260px 1fr 300px' : '260px 1fr 0px',
        gridTemplateRows: `auto 1fr ${selectedDayDate ? '260px' : '0px'}`,
        gridTemplateAreas: `
          "header tabs tabs"
          "deadlines calendar detail"
          "deadlines dayview detail"
        `,
        height: '100vh',
        gap: '8px',
        padding: '8px',
        boxSizing: 'border-box',
        transition: 'grid-template-columns 0.25s ease, grid-template-rows 0.25s ease'
      }}
    >
      <div style={{ gridArea: 'header', display: 'flex', alignItems: 'center' }}>
        <h1 className="app-header">就活カレンダー</h1>
      </div>

      <div style={{ gridArea: 'tabs', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="tab-bar">
          <button className="layer-tab is-all" onClick={() => setSelectedLayerId('all')}>
            すべて
          </button>
          {layers.map((layer) => (
            <button
              key={layer.id}
              className="layer-tab"
              onClick={() => setSelectedLayerId(layer.id)}
              style={{ backgroundColor: layer.color }}
            >
              {layer.name}
            </button>
          ))}
          <button className="icon-btn is-square" onClick={() => setIsLayerModalOpen(true)}>
            ⚙
          </button>
        </div>

        <button
          className="primary-btn"
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
            setBulkMode('single')
            setNewDueDateEnd('')
            setMultipleDates([])
          }}
        >
          ＋ 予定を追加
        </button>
      </div>

      <div style={{ gridArea: 'deadlines', overflowY: 'auto' }}>
        <p className="panel-title">今週の締め切り</p>
        <ul>
          {weeklyDeadlines.map((event) => {
            const daysLeft = differenceInCalendarDays(new Date(event.dueDate), startOfToday())
            const isUrgent = daysLeft <= 2
            const countdownText =
              daysLeft < 0 ? '期限超過' : daysLeft === 0 ? '今日' : `あと${daysLeft}日`

            return (
              <li
                key={event.id}
                onClick={() => setSelectedEventId(event.id)}
                className={`deadline-card${selectedEventId === event.id ? ' is-selected' : ''}`}
                style={{
                  borderLeftColor: layers.find((l) => l.id === event.layerId)?.color ?? '#ccc'
                }}
              >
                <div className="deadline-title">{event.title}</div>
                <div className="deadline-meta">
                  <span className="deadline-date">
                    {event.dueDate}
                    {event.isAllDay ? '' : ` ${event.time}`}
                  </span>
                  <span className={`deadline-countdown${isUrgent ? ' is-urgent' : ''}`}>
                    {countdownText}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      <div style={{ gridArea: 'calendar', overflowY: 'auto' }}>
        <CalendarGrid
          year={2026}
          month={7}
          events={filteredEvents}
          layers={layers}
          onDateDoubleClick={handleDateDoubleClick}
          onDateClick={handleDateClick}
          onEventClick={(event) => setSelectedEventId(event.id)}
        />
      </div>
      <div
        style={{
          gridArea: 'dayview',
          overflow: 'hidden',
          borderTop: selectedDayDate ? '1px solid var(--line)' : 'none',
          paddingTop: selectedDayDate ? '8px' : 0
        }}
      >
        <DayView
          date={selectedDayDate}
          events={filteredEvents}
          layers={layers}
          onEventClick={(event) => setSelectedEventId(event.id)}
        />
      </div>
      <div
        className="detail-panel"
        style={{
          gridArea: 'detail',
          borderLeft: selectedEventId ? '1px solid var(--line)' : 'none',
          paddingLeft: selectedEventId ? '8px' : 0
        }}
      >
        {(() => {
          const selectedEvent = events.find((event) => event.id === selectedEventId)

          if (!selectedEvent) {
            return <p style={{ color: 'var(--ink-sub)', fontSize: '13px' }}>予定を選択してください</p>
          }

          const layer = layers.find((l) => l.id === selectedEvent.layerId)

          return (
            <div>
              <div className="detail-badge" style={{ backgroundColor: layer?.color ?? '#ccc' }}>
                {layer?.name ?? '不明'}
              </div>

              <h3 className="detail-title">{selectedEvent.title}</h3>

              <p className="detail-meta">
                {selectedEvent.hasDeadline ? '期限' : '日付'}: {selectedEvent.dueDate}
                {selectedEvent.isAllDay ? '（終日）' : ` ${selectedEvent.time}`}
              </p>

              {selectedEvent.memo && <p className="detail-memo">{selectedEvent.memo}</p>}

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

              <div className="detail-actions">
                <button className="icon-btn" onClick={() => handleEditEvent(selectedEvent)}>
                  編集
                </button>
                <button
                  className="icon-btn"
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
        <div className="modal-overlay" onClick={() => setIsEventModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2>{!editingEventId && (
              <div style={{ display: 'flex', gap: '10px', fontSize: '13px', marginBottom: '10px' }}>
                <label>
                  <input
                    type="radio"
                    checked={bulkMode === 'single'}
                    onChange={() => setBulkMode('single')}
                  />
                  単体
                </label>
                <label>
                  <input
                    type="radio"
                    checked={bulkMode === 'range'}
                    onChange={() => setBulkMode('range')}
                  />
                  連続した期間
                </label>
                <label>
                  <input
                    type="radio"
                    checked={bulkMode === 'multiple'}
                    onChange={() => setBulkMode('multiple')}
                  />
                  複数の個別日付
                </label>
                <label>
                  <input
                    type="radio"
                    checked={bulkMode === 'recurring'}
                    onChange={() => setBulkMode('recurring')}
                  />
                  定期（曜日指定）
                </label>
              </div>
            )}
            </h2>

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

            {(bulkMode === 'range' || bulkMode === 'recurring') && !editingEventId ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                  />
                  <span>〜</span>
                  <input
                    type="date"
                    value={newDueDateEnd}
                    onChange={(e) => setNewDueDateEnd(e.target.value)}
                    title="空欄の場合、開始日から半年後まで自動的に作成されます"
                  />
                </div>

                {bulkMode === 'recurring' && (
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                    {['日', '月', '火', '水', '木', '金', '土'].map((label, index) => (
                      <label key={index} style={{ fontSize: '12px' }}>
                        <input
                          type="checkbox"
                          checked={recurringWeekdays.includes(index)}
                          onChange={() => toggleWeekday(index)}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ) : bulkMode === 'multiple' && !editingEventId ? (
              <div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} />
                  <button type="button" className="icon-btn" onClick={handleAddDateToList}>
                    追加
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                  {multipleDates.map((date) => (
                    <span
                      key={date}
                      style={{
                        fontSize: '11px',
                        background: 'var(--paper-soft)',
                        border: '1px solid var(--line)',
                        borderRadius: '10px',
                        padding: '2px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {date}
                      <span
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleRemoveDateFromList(date)}
                      >
                        ×
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} />
              </div>
            )}

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
              <button className="primary-btn" onClick={handleAddEvent}>
                {editingEventId ? '更新する' : '追加する'}
              </button>
              <button className="icon-btn" onClick={() => setIsEventModalOpen(false)}>
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {isLayerModalOpen && (
        <div className="modal-overlay" onClick={() => setIsLayerModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
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
                      border: layer.color === color ? '2px solid var(--ink)' : 'none',
                      padding: 0
                    }}
                  />
                ))}
                <button className="icon-btn" onClick={() => handleDeleteLayer(layer.id)}>
                  削除
                </button>
              </div>
            ))}

            <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '12px 0' }} />

            <div>
              <input
                type="text"
                value={newLayerName}
                onChange={(e) => setNewLayerName(e.target.value)}
                placeholder="新しいレイヤー名"
              />
              <button className="primary-btn" onClick={handleAddLayer}>
                ＋追加
              </button>
            </div>

            <button
              className="icon-btn"
              onClick={() => setIsLayerModalOpen(false)}
              style={{ marginTop: '12px' }}
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App