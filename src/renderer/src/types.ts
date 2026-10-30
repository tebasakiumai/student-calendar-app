export interface Layer {
  id: string
  name: string // ユーザーが自由に作成（例: "就活", "サークル"）
  color: string // 表示色
}

export interface CalendarEvent {
  id: string
  title: string
  layerId: string // Layerのidを参照
  memo?: string
  dueDate: string // 期限日（例: "2026-08-10"）
  endDate?: string // 終了日
  hasDeadline: boolean // 期限付きかどうか
  isAllDay: boolean // 終日 or 時間指定
  time?: string // isAllDayがfalseの時だけ使う（例: "14:00"）
  endTime?: string // 終了時刻
  link?: string // 提出先リンク
  status: '未着手' | '進行中' | '完了'
}

export const defaultLayers: Layer[] = [
  { id: 'l1', name: '就活', color: '#7F77DD' },
  { id: 'l2', name: '学校', color: '#1D9E75' },
  { id: 'l3', name: '趣味', color: '#E07A4E' }
]