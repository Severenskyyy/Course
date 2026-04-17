import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Book, Reader, Loan, Reservation, Notification, UserRole, SystemSettings } from '../types';
import { users as initialUsers, books as initialBooks, readers as initialReaders, loans as initialLoans, reservations as initialReservations } from '../data/mockData';

const defaultSettings: SystemSettings = {
  overdueThreshold: 15,
  defaultLoanDays: 14,
  maxLoansPerReader: 5,
  reservationHours: 24,
  reservationCooldownDays: 3,
  enableEmailNotifications: true,
  enableSmsNotifications: false,
  libraryName: 'Библиотека АБИС',
  libraryAddress: 'г. Москва, ул. Примерная, д. 1',
  libraryPhone: '+7 (495) 123-45-67',
  libraryEmail: 'library@abis.ru',
  workingHours: 'Пн-Пт: 9:00-18:00, Сб: 10:00-15:00',
};

interface AppContextType {
  // Auth
  currentUser: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  
  // Data
  books: Book[];
  readers: Reader[];
  loans: Loan[];
  reservations: Reservation[];
  notifications: Notification[];
  staffNotifications: Notification[];
  settings: SystemSettings;
  
  // Actions
  addBook: (book: Book) => void;
  updateBook: (bookCode: string, book: Partial<Book>) => void;
  deleteBook: (bookCode: string) => void;
  
  addReader: (reader: Reader) => void;
  updateReader: (readerId: string, reader: Partial<Reader>) => void;
  deleteReader: (readerId: string) => void;
  
  issueLoan: (readerId: string, bookCode: string, dueDate: string) => void;
  returnLoan: (loanId: string) => void;
  
  createReservation: (bookCode: string) => { success: boolean; message: string };
  cancelReservation: (reservationId: string) => void;
  canReserveBook: (bookCode: string) => { canReserve: boolean; reason?: string };
  
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
  markStaffNotificationRead: (notificationId: string) => void;
  markAllStaffNotificationsRead: () => void;
  
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  
  // Helpers
  getBookByCode: (code: string) => Book | undefined;
  getReaderById: (id: string) => Reader | undefined;
  getLoansByReader: (readerId: string) => Loan[];
  getActiveLoanByBook: (bookCode: string) => Loan | undefined;
  isBookAvailable: (bookCode: string) => boolean;
  
  // Role check
  hasRole: (...roles: UserRole[]) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [readers, setReaders] = useState<Reader[]>(initialReaders);
  const [loans, setLoans] = useState<Loan[]>(initialLoans);
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [staffNotifications, setStaffNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);

  // Генерация уведомлений при изменении выдач или пользователя
  useEffect(() => {
    if (currentUser?.role === 'reader' && currentUser.readerId) {
      generateNotifications(currentUser.readerId);
    } else {
      setNotifications([]);
    }
  }, [currentUser, loans]);

  const generateNotifications = (readerId: string) => {
    const today = new Date();
    const readerLoans = loans.filter(l => l.reader_id === readerId && !l.return_date);
    const newNotifications: Notification[] = [];

    readerLoans.forEach(loan => {
      const dueDate = new Date(loan.due_date);
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const book = books.find(b => b.book_code === loan.book_code);
      const bookTitle = book?.title || 'Неизвестная книга';

      let notification: Notification | null = null;

      if (daysUntilDue < 0) {
        notification = {
          id: `notif_${loan.loan_id}_overdue`,
          type: 'overdue',
          title: '🚨 Просрочка возврата!',
          message: `Книга просрочена на ${Math.abs(daysUntilDue)} дн.`,
          bookTitle,
          dueDate: loan.due_date,
          daysUntilDue,
          isRead: false,
          createdAt: today.toISOString(),
        };
      } else if (daysUntilDue <= 1) {
        notification = {
          id: `notif_${loan.loan_id}_1day`,
          type: 'one_day',
          title: daysUntilDue === 0 ? '⚠️ Верните сегодня!' : '🔔 Срок возврата завтра',
          message: daysUntilDue === 0 ? 'Книгу нужно вернуть сегодня' : 'Книгу нужно вернуть завтра',
          bookTitle,
          dueDate: loan.due_date,
          daysUntilDue,
          isRead: false,
          createdAt: today.toISOString(),
        };
      } else if (daysUntilDue <= 3) {
        notification = {
          id: `notif_${loan.loan_id}_3days`,
          type: 'three_days',
          title: '📅 Скоро срок возврата',
          message: `Книгу нужно вернуть через ${daysUntilDue} дн.`,
          bookTitle,
          dueDate: loan.due_date,
          daysUntilDue,
          isRead: false,
          createdAt: today.toISOString(),
        };
      } else if (daysUntilDue <= 7) {
        notification = {
          id: `notif_${loan.loan_id}_week`,
          type: 'week_before',
          title: '📚 Напоминание о возврате',
          message: `Книгу нужно вернуть через ${daysUntilDue} дн.`,
          bookTitle,
          dueDate: loan.due_date,
          daysUntilDue,
          isRead: false,
          createdAt: today.toISOString(),
        };
      }

      if (notification) {
        newNotifications.push(notification);
      }
    });

    // Сортировка: сначала просрочки, потом по срочности
    newNotifications.sort((a, b) => (a.daysUntilDue ?? 0) - (b.daysUntilDue ?? 0));
    setNotifications(newNotifications);
  };

  const login = (username: string, password: string): boolean => {
    const user = initialUsers.find(u => u.username === username && u.password === password);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    setNotifications([]);
  };

  const hasRole = (...roles: UserRole[]): boolean => {
    return currentUser ? roles.includes(currentUser.role) : false;
  };

  // Book actions
  const addBook = (book: Book) => {
    setBooks(prev => [...prev, book]);
  };

  const updateBook = (bookCode: string, updates: Partial<Book>) => {
    setBooks(prev => prev.map(b => b.book_code === bookCode ? { ...b, ...updates } : b));
  };

  const deleteBook = (bookCode: string) => {
    setBooks(prev => prev.filter(b => b.book_code !== bookCode));
  };

  // Reader actions
  const addReader = (reader: Reader) => {
    setReaders(prev => [...prev, reader]);
  };

  const updateReader = (readerId: string, updates: Partial<Reader>) => {
    setReaders(prev => prev.map(r => r.reader_id === readerId ? { ...r, ...updates } : r));
  };

  const deleteReader = (readerId: string) => {
    const hasActiveLoans = loans.some(l => l.reader_id === readerId && !l.return_date);
    if (hasActiveLoans) return;
    setReaders(prev => prev.filter(r => r.reader_id !== readerId));
  };

  // Loan actions
  const issueLoan = (readerId: string, bookCode: string, dueDate: string) => {
    const loanId = `LN${String(loans.length + 1).padStart(5, '0')}`;
    const today = new Date().toISOString().split('T')[0];
    const book = books.find(b => b.book_code === bookCode);
    const reader = readers.find(r => r.reader_id === readerId);
    
    const newLoan: Loan = {
      loan_id: loanId,
      reader_id: readerId,
      book_code: bookCode,
      issue_date: today,
      due_date: dueDate,
      created_by: currentUser?.id,
    };
    
    setLoans(prev => [...prev, newLoan]);
    setBooks(prev => prev.map(b => b.book_code === bookCode ? { ...b, isAvailable: false } : b));
    
    // Отменяем бронирование, если есть
    setReservations(prev => prev.map(r => 
      r.book_code === bookCode && r.reader_id === readerId && r.is_active 
        ? { ...r, is_active: false } 
        : r
    ));

    // Добавляем уведомление для сотрудников
    addStaffNotification({
      type: 'issue_success',
      title: '📘 Книга выдана',
      message: `Книга выдана читателю ${reader?.fio || 'Неизвестный'} до ${dueDate}`,
      bookTitle: book?.title || 'Неизвестная книга',
      readerName: reader?.fio,
      dueDate: dueDate,
    });
  };

  const returnLoan = (loanId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const loan = loans.find(l => l.loan_id === loanId);
    
    if (loan) {
      const book = books.find(b => b.book_code === loan.book_code);
      const reader = readers.find(r => r.reader_id === loan.reader_id);
      const wasOverdue = new Date(loan.due_date) < new Date();
      
      setLoans(prev => prev.map(l => 
        l.loan_id === loanId 
          ? { ...l, return_date: today, returned_by: currentUser?.id } 
          : l
      ));
      setBooks(prev => prev.map(b => 
        b.book_code === loan.book_code ? { ...b, isAvailable: true } : b
      ));

      // Добавляем уведомление для сотрудников
      addStaffNotification({
        type: 'return_success',
        title: wasOverdue ? '📗 Книга возвращена (была просрочена)' : '📗 Книга успешно возвращена',
        message: `${reader?.fio || 'Читатель'} вернул книгу${wasOverdue ? ' с просрочкой' : ''}`,
        bookTitle: book?.title || 'Неизвестная книга',
        readerName: reader?.fio,
        dueDate: loan.due_date,
      });
    }
  };

  // Reservation actions
  const canReserveBook = (bookCode: string): { canReserve: boolean; reason?: string } => {
    if (!currentUser?.readerId) {
      return { canReserve: false, reason: 'Только читатели могут бронировать книги' };
    }

    const book = books.find(b => b.book_code === bookCode);
    if (!book) {
      return { canReserve: false, reason: 'Книга не найдена' };
    }

    // Проверяем, не выдана ли книга
    const activeLoan = loans.find(l => l.book_code === bookCode && !l.return_date);
    if (activeLoan) {
      return { canReserve: false, reason: 'Книга уже выдана' };
    }

    // Проверяем активную бронь
    const now = new Date();
    const activeReservation = reservations.find(r => 
      r.book_code === bookCode && r.is_active && new Date(r.expires_at) > now
    );
    if (activeReservation) {
      if (activeReservation.reader_id === currentUser.readerId) {
        return { canReserve: false, reason: 'Вы уже забронировали эту книгу' };
      }
      return { canReserve: false, reason: 'Книга забронирована другим читателем' };
    }

    // Проверяем cooldown (3 дня)
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const recentReservation = reservations.find(r =>
      r.book_code === bookCode && 
      r.reader_id === currentUser.readerId && 
      new Date(r.reserved_at) > threeDaysAgo
    );
    if (recentReservation) {
      return { canReserve: false, reason: 'Повторное бронирование возможно через 3 дня' };
    }

    return { canReserve: true };
  };

  const createReservation = (bookCode: string): { success: boolean; message: string } => {
    const check = canReserveBook(bookCode);
    if (!check.canReserve) {
      return { success: false, message: check.reason || 'Ошибка бронирования' };
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const reservation: Reservation = {
      reservation_id: `RES${String(reservations.length + 1).padStart(5, '0')}`,
      reader_id: currentUser!.readerId!,
      book_code: bookCode,
      reserved_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      is_active: true,
    };

    setReservations(prev => [...prev, reservation]);
    return { success: true, message: 'Книга забронирована на 24 часа' };
  };

  const cancelReservation = (reservationId: string) => {
    setReservations(prev => prev.map(r =>
      r.reservation_id === reservationId ? { ...r, is_active: false } : r
    ));
  };

  // Notifications
  const markNotificationRead = (notificationId: string) => {
    setNotifications(prev => prev.map(n =>
      n.id === notificationId ? { ...n, isRead: true } : n
    ));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const markStaffNotificationRead = (notificationId: string) => {
    setStaffNotifications(prev => prev.map(n =>
      n.id === notificationId ? { ...n, isRead: true } : n
    ));
  };

  const markAllStaffNotificationsRead = () => {
    setStaffNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const addStaffNotification = (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => {
    const newNotif: Notification = {
      ...notification,
      id: `staff_notif_${Date.now()}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setStaffNotifications(prev => [newNotif, ...prev].slice(0, 50)); // Храним последние 50
  };

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // Helpers
  const getBookByCode = (code: string) => books.find(b => b.book_code === code);
  const getReaderById = (id: string) => readers.find(r => r.reader_id === id);
  const getLoansByReader = (readerId: string) => loans.filter(l => l.reader_id === readerId);
  const getActiveLoanByBook = (bookCode: string) => loans.find(l => l.book_code === bookCode && !l.return_date);
  const isBookAvailable = (bookCode: string) => {
    const book = books.find(b => b.book_code === bookCode);
    return book?.isAvailable ?? false;
  };

  const value: AppContextType = {
    currentUser,
    login,
    logout,
    books,
    readers,
    loans,
    reservations,
    notifications,
    staffNotifications,
    settings,
    addBook,
    updateBook,
    deleteBook,
    addReader,
    updateReader,
    deleteReader,
    issueLoan,
    returnLoan,
    createReservation,
    cancelReservation,
    canReserveBook,
    markNotificationRead,
    markAllNotificationsRead,
    markStaffNotificationRead,
    markAllStaffNotificationsRead,
    updateSettings,
    getBookByCode,
    getReaderById,
    getLoansByReader,
    getActiveLoanByBook,
    isBookAvailable,
    hasRole,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
