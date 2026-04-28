// ── Shared with student app ───────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  role: "student";
  current_class: number | null;
  medium: string;
  created_at: string;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  plan_type: string;
  billing_cycle: string;
  price_paise: number;
  original_price_paise: number | null;
  is_featured: boolean;
  features: string[];
}

export interface Subscription {
  id: string;
  plan: Plan;
  status: string;
  started_at: string;
  expires_at: string | null;
}

// ── Admin-specific ────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  name: string;
  email: string | null;
  role: "super_admin" | "admin" | "support" | "content_manager";
  avatar_url: string | null;
  created_at: string;
}

export interface RevenueDay {
  date: string;
  amount_paise: number;
}

export interface DashboardStats {
  total_students: number;
  active_subscriptions: number;
  mrr_paise: number;
  new_signups_today: number;
  pending_doubts: number;
  revenue_last_30_days: RevenueDay[];
}

export interface StudentRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  current_class: number | null;
  subscription_status: "active" | "trial" | "free";
  joined_at: string;
}

export interface ContentSubject {
  id: string;
  name: string;
  name_ml: string;
  slug: string;
  class_number: number;
  icon: string;
  color: string;
  monthly_price_paise: number;
  is_active: boolean;
  order_index: number;
  created_at: string;
}

export interface ContentChapter {
  id: string;
  subject_id: string;
  chapter_number: number;
  title: string;
  title_ml: string;
  description: string | null;
  is_published: boolean;
  order_index: number;
  created_at: string;
}

export interface ContentLesson {
  id: string;
  chapter_id: string;
  title: string;
  title_ml: string;
  youtube_video_id: string;
  duration_seconds: number | null;
  is_free: boolean;
  is_published: boolean;
  thumbnail_url: string | null;
  order_index: number;
}

export interface AdminDoubt {
  id: string;
  student_name: string;
  question_text: string;
  chapter_id: string | null;
  lesson_id: string | null;
  status: "pending" | "answered";
  created_at: string;
}

export interface AdminQuestion {
  id: string;
  text: string;
  text_ml: string;
  options: string[];
  marks: number;
  correct_answer: number;
  explanation: string;
}

export interface AdminTest {
  id: string;
  subject_id: string;
  chapter_id: string;
  lesson_id: string | null;
  title: string;
  duration_minutes: number;
  total_marks: number;
  questions: AdminQuestion[];
  is_published: boolean;
  created_at: string;
}
