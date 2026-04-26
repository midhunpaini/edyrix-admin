// Material Symbols icon name registry — one source of truth for all icon names.
// Usage: import { Icons } from "@/lib/icons"; then <Icon name={Icons.dashboard} />

export const Icons = {
  // Navigation / Sidebar
  dashboard: "dashboard",
  content: "menu_book",
  students: "group",
  questions: "quiz",
  doubts: "forum",
  settings: "settings",
  logout: "logout",
  close: "close",
  menu: "menu",

  // General actions
  back: "arrow_back",
  forward: "arrow_forward",
  search: "search",
  filter: "filter_list",
  sort: "sort",
  more: "more_vert",
  edit: "edit",
  delete: "delete",
  add: "add",
  save: "save",
  check: "check",
  checkCircle: "check_circle",
  info: "info",
  warning: "warning",
  error: "error",

  // Content management
  subject: "category",
  chapter: "layers",
  lesson: "play_lesson",
  video: "smart_display",
  upload: "upload",
  download: "download",
  publish: "publish",
  unpublish: "unpublished",
  preview: "preview",
  link: "link",
  copy: "content_copy",

  // Tests / Questions
  quiz: "quiz",
  question: "help",
  option: "radio_button_checked",
  correct: "check_circle",
  wrong: "cancel",
  explanation: "lightbulb",
  timer: "timer",
  marks: "star",
  lock: "lock",
  unlock: "lock_open",

  // Students
  student: "person",
  avatar: "account_circle",
  subscription: "workspace_premium",
  active: "verified",
  inactive: "block",
  phone: "phone",
  email: "mail",
  class: "class",
  school: "school",

  // Doubts
  doubt: "contact_support",
  resolve: "task_alt",
  pending: "pending",
  image: "image",
  send: "send",

  // Stats / Analytics
  revenue: "payments",
  growth: "trending_up",
  users: "people",
  views: "visibility",
  time: "schedule",
  calendar: "calendar_today",
  rank: "leaderboard",

  // UI
  notifications: "notifications",
  notificationsBadge: "notifications_active",
  refresh: "refresh",
  loading: "progress_activity",
  empty: "inbox",
  expand: "expand_more",
  collapse: "expand_less",
  share: "share",
} as const;

export type IconName = (typeof Icons)[keyof typeof Icons];
