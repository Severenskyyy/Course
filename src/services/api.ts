/**
 * API сервис для работы с FastAPI backend
 * Базовый URL: http://localhost:8000/api
 */

const API_BASE_URL = 'http://localhost:8000/api';

// Типы данных
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
  is_available: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Reader {
  reader_id: string;
  fio: string;
  group: string;
  email?: string;
  phone?: string;
  created_at: string;
  updated_at?: string;
}

export interface Loan {
  loan_id: string;
  reader_id: string;
  book_code: string;
  issue_date: string;
  due_date: string;
  return_date?: string;
  is_overdue: boolean;
  days_overdue: number;
  created_by?: string;
  returned_by?: string;
  created_at: string;
  updated_at?: string;
  reader_fio?: string;
  reader_group?: string;
  book_title?: string;
  book_author?: string;
}

export interface Reservation {
  reservation_id: string;
  reader_id: string;
  book_code: string;
  reserved_at: string;
  expires_at: string;
  is_active: boolean;
  book_title?: string;
  book_author?: string;
}

export interface Notification {
  notification_id: string;
  reader_id: string;
  loan_id: string;
  type: string;
  title: string;
  message: string;
  book_title: string;
  due_date: string;
  days_until_due: number;
  is_read: boolean;
  created_at: string;
}

export interface User {
  user_id: string;
  username: string;
  role: 'admin' | 'librarian' | 'reader';
  full_name: string;
  reader_id?: string;
  is_active: boolean;
  created_at: string;
}

export interface KPIMetrics {
  total_books: number;
  total_readers: number;
  active_loans: number;
  overdue_loans: number;
  overdue_percentage: number;
  target_threshold: number;
  is_within_target: boolean;
  average_overdue_days: number;
  median_overdue_days: number;
  total_reservations: number;
  books_in_circulation: number;
  circulation_rate: number;
}

export interface OverdueReportItem {
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

export interface OverdueReport {
  items: OverdueReportItem[];
  total_overdue: number;
  total_active_loans: number;
  overdue_percentage: number;
  average_overdue_days: number;
  median_overdue_days: number;
  generated_at: string;
}

export interface TopReader {
  reader_id: string;
  fio: string;
  group: string;
  overdue_count: number;
  total_overdue_days: number;
}

export interface TopBook {
  book_code: string;
  title: string;
  author: string;
  overdue_count: number;
  total_overdue_days: number;
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

export interface ImportResult {
  success: boolean;
  total_records: number;
  imported: number;
  skipped: number;
  errors: string[];
}

// Хелпер для получения токена
const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Хелпер для запросов с авторизацией
const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });
  
  if (response.status === 401) {
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
  }
  
  return response;
};

// ==================== АУТЕНТИФИКАЦИЯ ====================

export const authAPI = {
  async login(username: string, password: string): Promise<{ access_token: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Ошибка авторизации');
    }
    
    const data = await response.json();
    localStorage.setItem('auth_token', data.access_token);
    return data;
  },
  
  async getCurrentUser(): Promise<User> {
    const response = await fetchWithAuth('/me');
    if (!response.ok) {
      throw new Error('Не удалось получить данные пользователя');
    }
    return response.json();
  },
  
  logout() {
    localStorage.removeItem('auth_token');
  },
  
  isAuthenticated(): boolean {
    return !!getToken();
  }
};

// ==================== КНИГИ ====================

export const booksAPI = {
  async getAll(params?: {
    search?: string;
    author?: string;
    udk?: string;
    available_only?: boolean;
    skip?: number;
    limit?: number;
  }): Promise<Book[]> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.author) queryParams.append('author', params.author);
    if (params?.udk) queryParams.append('udk', params.udk);
    if (params?.available_only) queryParams.append('available_only', 'true');
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const response = await fetchWithAuth(`/books?${queryParams}`);
    if (!response.ok) throw new Error('Ошибка загрузки книг');
    return response.json();
  },
  
  async getById(bookCode: string): Promise<Book> {
    const response = await fetchWithAuth(`/books/${bookCode}`);
    if (!response.ok) throw new Error('Книга не найдена');
    return response.json();
  },
  
  async getAuthors(): Promise<string[]> {
    const response = await fetchWithAuth('/books/authors');
    if (!response.ok) throw new Error('Ошибка загрузки авторов');
    return response.json();
  },
  
  async getUDKList(): Promise<string[]> {
    const response = await fetchWithAuth('/books/udk');
    if (!response.ok) throw new Error('Ошибка загрузки УДК');
    return response.json();
  },
  
  async create(book: Omit<Book, 'is_available' | 'created_at' | 'updated_at'>): Promise<Book> {
    const response = await fetchWithAuth('/books', {
      method: 'POST',
      body: JSON.stringify(book),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Ошибка создания книги');
    }
    return response.json();
  },
  
  async update(bookCode: string, data: Partial<Book>): Promise<Book> {
    const response = await fetchWithAuth(`/books/${bookCode}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Ошибка обновления книги');
    }
    return response.json();
  },
  
  async delete(bookCode: string): Promise<void> {
    const response = await fetchWithAuth(`/books/${bookCode}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Ошибка удаления книги');
    }
  }
};

// ==================== ЧИТАТЕЛИ ====================

export const readersAPI = {
  async getAll(params?: {
    search?: string;
    group?: string;
    skip?: number;
    limit?: number;
  }): Promise<Reader[]> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.group) queryParams.append('group', params.group);
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const response = await fetchWithAuth(`/readers?${queryParams}`);
    if (!response.ok) throw new Error('Ошибка загрузки читателей');
    return response.json();
  },
  
  async getById(readerId: string): Promise<Reader> {
    const response = await fetchWithAuth(`/readers/${readerId}`);
    if (!response.ok) throw new Error('Читатель не найден');
    return response.json();
  },
  
  async getGroups(): Promise<string[]> {
    const response = await fetchWithAuth('/readers/groups');
    if (!response.ok) throw new Error('Ошибка загрузки групп');
    return response.json();
  },
  
  async create(reader: Omit<Reader, 'created_at' | 'updated_at'> & { password: string }): Promise<Reader> {
    const response = await fetchWithAuth('/readers', {
      method: 'POST',
      body: JSON.stringify(reader),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Ошибка создания читателя');
    }
    return response.json();
  },
  
  async update(readerId: string, data: Partial<Reader>): Promise<Reader> {
    const response = await fetchWithAuth(`/readers/${readerId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Ошибка обновления читателя');
    }
    return response.json();
  },
  
  async delete(readerId: string): Promise<void> {
    const response = await fetchWithAuth(`/readers/${readerId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Ошибка удаления читателя');
    }
  }
};

// ==================== ВЫДАЧИ ====================

export const loansAPI = {
  async getAll(params?: {
    reader_id?: string;
    book_code?: string;
    status?: 'active' | 'returned' | 'overdue';
    date_from?: string;
    date_to?: string;
    skip?: number;
    limit?: number;
  }): Promise<Loan[]> {
    const queryParams = new URLSearchParams();
    if (params?.reader_id) queryParams.append('reader_id', params.reader_id);
    if (params?.book_code) queryParams.append('book_code', params.book_code);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const response = await fetchWithAuth(`/loans?${queryParams}`);
    if (!response.ok) throw new Error('Ошибка загрузки выдач');
    return response.json();
  },
  
  async getById(loanId: string): Promise<Loan> {
    const response = await fetchWithAuth(`/loans/${loanId}`);
    if (!response.ok) throw new Error('Выдача не найдена');
    return response.json();
  },
  
  async create(data: { reader_id: string; book_code: string; due_date: string }): Promise<Loan> {
    const response = await fetchWithAuth('/loans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Ошибка создания выдачи');
    }
    return response.json();
  },
  
  async return(loanId: string, returnDate?: string): Promise<Loan> {
    const response = await fetchWithAuth(`/loans/${loanId}/return`, {
      method: 'POST',
      body: JSON.stringify({ return_date: returnDate }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Ошибка возврата книги');
    }
    return response.json();
  },
  
  async delete(loanId: string): Promise<void> {
    const response = await fetchWithAuth(`/loans/${loanId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Ошибка удаления выдачи');
    }
  }
};

// ==================== БРОНИРОВАНИЯ ====================

export const reservationsAPI = {
  async getAll(): Promise<Reservation[]> {
    const response = await fetchWithAuth('/reservations');
    if (!response.ok) throw new Error('Ошибка загрузки бронирований');
    return response.json();
  },
  
  async getMyReservations(): Promise<Reservation[]> {
    const response = await fetchWithAuth('/reservations/my');
    if (!response.ok) throw new Error('Ошибка загрузки бронирований');
    return response.json();
  },
  
  async create(bookCode: string): Promise<Reservation> {
    const response = await fetchWithAuth('/reservations', {
      method: 'POST',
      body: JSON.stringify({ book_code: bookCode }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Ошибка бронирования');
    }
    return response.json();
  },
  
  async cancel(reservationId: string): Promise<void> {
    const response = await fetchWithAuth(`/reservations/${reservationId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Ошибка отмены бронирования');
    }
  },
  
  async canReserve(bookCode: string): Promise<{ can_reserve: boolean; reason?: string }> {
    const response = await fetchWithAuth(`/reservations/can-reserve/${bookCode}`);
    if (!response.ok) throw new Error('Ошибка проверки бронирования');
    return response.json();
  }
};

// ==================== УВЕДОМЛЕНИЯ ====================

export const notificationsAPI = {
  async getMyNotifications(): Promise<Notification[]> {
    const response = await fetchWithAuth('/notifications/my');
    if (!response.ok) throw new Error('Ошибка загрузки уведомлений');
    return response.json();
  },
  
  async markAsRead(notificationId: string): Promise<void> {
    const response = await fetchWithAuth(`/notifications/${notificationId}/read`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Ошибка обновления уведомления');
  },
  
  async markAllAsRead(): Promise<void> {
    const response = await fetchWithAuth('/notifications/read-all', {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Ошибка обновления уведомлений');
  }
};

// ==================== ОТЧЁТЫ ====================

export const reportsAPI = {
  async getOverdueReport(params?: {
    group?: string;
    author?: string;
    udk?: string;
    min_days?: number;
    max_days?: number;
  }): Promise<OverdueReport> {
    const queryParams = new URLSearchParams();
    if (params?.group) queryParams.append('group', params.group);
    if (params?.author) queryParams.append('author', params.author);
    if (params?.udk) queryParams.append('udk', params.udk);
    if (params?.min_days) queryParams.append('min_days', params.min_days.toString());
    if (params?.max_days) queryParams.append('max_days', params.max_days.toString());
    
    const response = await fetchWithAuth(`/reports/overdue?${queryParams}`);
    if (!response.ok) throw new Error('Ошибка загрузки отчёта');
    return response.json();
  },
  
  async exportOverdueCSV(params?: {
    group?: string;
    author?: string;
    udk?: string;
    min_days?: number;
    max_days?: number;
  }): Promise<Blob> {
    const queryParams = new URLSearchParams();
    if (params?.group) queryParams.append('group', params.group);
    if (params?.author) queryParams.append('author', params.author);
    if (params?.udk) queryParams.append('udk', params.udk);
    if (params?.min_days) queryParams.append('min_days', params.min_days.toString());
    if (params?.max_days) queryParams.append('max_days', params.max_days.toString());
    
    const response = await fetchWithAuth(`/reports/overdue/export?${queryParams}`);
    if (!response.ok) throw new Error('Ошибка экспорта отчёта');
    return response.blob();
  },
  
  async getKPI(): Promise<KPIMetrics> {
    const response = await fetchWithAuth('/reports/kpi');
    if (!response.ok) throw new Error('Ошибка загрузки KPI');
    return response.json();
  },
  
  async getTopReaders(limit: number = 5): Promise<TopReader[]> {
    const response = await fetchWithAuth(`/reports/top-readers?limit=${limit}`);
    if (!response.ok) throw new Error('Ошибка загрузки топ читателей');
    return response.json();
  },
  
  async getTopBooks(limit: number = 5): Promise<TopBook[]> {
    const response = await fetchWithAuth(`/reports/top-books?limit=${limit}`);
    if (!response.ok) throw new Error('Ошибка загрузки топ книг');
    return response.json();
  },
  
  async getAuditLog(params?: {
    entity_type?: string;
    entity_id?: string;
    action?: string;
    date_from?: string;
    date_to?: string;
    skip?: number;
    limit?: number;
  }): Promise<AuditLogEntry[]> {
    const queryParams = new URLSearchParams();
    if (params?.entity_type) queryParams.append('entity_type', params.entity_type);
    if (params?.entity_id) queryParams.append('entity_id', params.entity_id);
    if (params?.action) queryParams.append('action', params.action);
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const response = await fetchWithAuth(`/reports/audit-log?${queryParams}`);
    if (!response.ok) throw new Error('Ошибка загрузки журнала');
    return response.json();
  }
};

// ==================== ИМПОРТ/ЭКСПОРТ (1С) ====================

export const importExportAPI = {
  async importBooks(file: File): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/import-export/books/import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Ошибка импорта книг');
    }
    return response.json();
  },
  
  async importReaders(file: File): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/import-export/readers/import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Ошибка импорта читателей');
    }
    return response.json();
  },
  
  async importLoans(file: File): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/import-export/loans/import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Ошибка импорта выдач');
    }
    return response.json();
  },
  
  async exportBooks(): Promise<Blob> {
    const response = await fetchWithAuth('/import-export/books/export');
    if (!response.ok) throw new Error('Ошибка экспорта книг');
    return response.blob();
  },
  
  async exportReaders(): Promise<Blob> {
    const response = await fetchWithAuth('/import-export/readers/export');
    if (!response.ok) throw new Error('Ошибка экспорта читателей');
    return response.blob();
  },
  
  async exportLoans(status?: string): Promise<Blob> {
    const queryParams = status ? `?status=${status}` : '';
    const response = await fetchWithAuth(`/import-export/loans/export${queryParams}`);
    if (!response.ok) throw new Error('Ошибка экспорта выдач');
    return response.blob();
  }
};

// ==================== HEALTH CHECK ====================

export const healthAPI = {
  async check(): Promise<{ status: string; database: string; books_count: number }> {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  }
};

// Экспорт всех API
export const api = {
  auth: authAPI,
  books: booksAPI,
  readers: readersAPI,
  loans: loansAPI,
  reservations: reservationsAPI,
  notifications: notificationsAPI,
  reports: reportsAPI,
  importExport: importExportAPI,
  health: healthAPI,
};

export default api;
