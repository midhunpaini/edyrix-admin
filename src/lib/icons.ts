// Central icon registry — never hardcode icon name strings in components.
// Usage: import { Icons } from '@/lib/icons'; then <Icon name={Icons.dashboard} />

export const Icons = {
  // ── Navigation / Sidebar ──
  dashboard:          'dashboard',
  content:            'library_books',
  students:           'group',
  questions:          'quiz',
  doubtQueue:         'support_agent',
  settings:           'settings',
  logout:             'logout',
  close:              'close',
  menu:               'menu',

  // ── General actions ──
  back:               'arrow_back',
  forward:            'arrow_forward',
  search:             'search',
  filter:             'tune',
  sort:               'swap_vert',
  more:               'more_vert',
  edit:               'edit',
  delete:             'delete',
  add:                'add',
  save:               'check',
  check:              'check_circle',
  checkCircle:        'check_circle',
  info:               'info',
  warning:            'warning',
  error:              'error',

  // ── Content management ──
  subject:            'category',
  chapter:            'layers',
  lesson:             'play_lesson',
  video:              'smart_display',
  upload:             'upload',
  download:           'download',
  publish:            'publish',
  unpublish:          'unpublished',
  preview:            'preview',
  link:               'link',
  copy:               'content_copy',
  visibility:         'visibility',
  visibilityOff:      'visibility_off',

  // ── Tests / Questions ──
  quiz:               'quiz',
  question:           'help',
  option:             'radio_button_checked',
  correct:            'check_circle',
  wrong:              'cancel',
  explanation:        'lightbulb',
  timer:              'timer',
  marks:              'star',
  lock:               'lock',
  unlock:             'lock_open',

  // ── Students ──
  student:            'person',
  avatar:             'account_circle',
  subscription:       'workspace_premium',
  premium:            'workspace_premium',
  active:             'verified',
  inactive:           'block',
  phone:              'phone',
  email:              'mail',
  class:              'class',
  school:             'school',

  // ── Doubts ──
  doubt:              'contact_support',
  answer:             'mark_chat_read',
  resolve:            'task_alt',
  pending:            'pending',
  image:              'image',
  send:               'send',

  // ── Stats / Analytics ──
  revenue:            'payments',
  growth:             'trending_up',
  users:              'people',
  views:              'visibility',
  time:               'schedule',
  calendar:           'calendar_today',
  rank:               'leaderboard',

  // ── UI ──
  notification:       'notifications',
  notifications:      'notifications',
  notificationsBadge: 'notifications_active',
  refresh:            'refresh',
  loading:            'progress_activity',
  empty:              'inbox',
  expand:             'expand_more',
  collapse:           'expand_less',
  share:              'share',
} as const

export type IconName = keyof typeof Icons
