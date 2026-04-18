// Типы данных для библиотечной системы АБИС

export type UserRole = 'admin' | 'librarian' | 'reader';

export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  fullName: string;
  readerId?: string;
}

export interface Book {
  book_code: string;
  title: string;
  author: string;
  year: number;
  udk: string;
  description?: string;
  publisher?: string;
  pages?: number;
  isbn?: string;
  isAvailable: boolean;
}

export interface Reader {
  reader_id: string;
  fio: string;
  group: string;
  email?: string;
  phone?: string;
}

export interface Loan {
  loan_id: string;
  reader_id: string;
  book_code: string;
  issue_date: string;
  due_date: string;
  return_date?: string;
  created_by?: string;
  returned_by?: string;
}

export interface Reservation {
  reservation_id: string;
  reader_id: string;
  book_code: string;
  reserved_at: string;
  expires_at: string;
  is_active: boolean;
}

export interface Notification {
  id: string;
  type: 'week_before' | 'three_days' | 'one_day' | 'overdue' | 'reservation' | 'return_success' | 'issue_success';
  title: string;
  message: string;
  bookTitle: string;
  readerName?: string;
  dueDate?: string;
  daysUntilDue?: number;
  isRead: boolean;
  createdAt: string;
}

export interface SystemSettings {
  overdueThreshold: number;
  defaultLoanDays: number;
  maxLoansPerReader: number;
  reservationHours: number;
  reservationCooldownDays: number;
  enableEmailNotifications: boolean;
  enableSmsNotifications: boolean;
  libraryName: string;
  libraryAddress: string;
  libraryPhone: string;
  libraryEmail: string;
  workingHours: string;
}

export interface OverdueItem {
  reader_id: string;
  fio: string;
  group: string;
  book_code: string;
  title: string;
  author: string;
  issue_date: string;
  due_date: string;
  return_date?: string;
  days_overdue: number;
}

export interface AuditLogEntry {
  log_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  old_value?: string;
  new_value?: string;
  user_id: string;
  username: string;
  created_at: string;
}
