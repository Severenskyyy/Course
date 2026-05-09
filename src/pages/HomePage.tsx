import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const { currentUser, books, readers, loans, notifications, hasRole } = useApp();
  const [modalType, setModalType] = useState<'books' | 'readers' | 'loans' | 'overdue' | null>(null);
  const [search, setSearch] = useState('');

  // Calculate statistics
  const activeLoans = loans.filter(l => !l.return_date);
  const today = new Date();
  const overdueLoans = activeLoans.filter(l => new Date(l.due_date) < today);
  const overduePercentage = activeLoans.length > 0 ? (overdueLoans.length / activeLoans.length * 100) : 0;
  const availableBooks = books.filter(b => b.isAvailable);

  const stats = [
    {
      id: 'books',
      title: 'Книги в фонде',
      value: books.length,
      subtitle: `${availableBooks.length} доступно`,
      icon: '📚',
      color: 'indigo',
      gradient: 'from-indigo-500 to-blue-600',
    },
    {
      id: 'readers',
      title: 'Читатели',
      value: readers.length,
      subtitle: '12 групп',
      icon: '👥',
      color: 'purple',
      gradient: 'from-purple-500 to-pink-600',
    },
    {
      id: 'loans',
      title: 'Активные выдачи',
      value: activeLoans.length,
      subtitle: `${loans.length} всего`,
      icon: '📖',
      color: 'emerald',
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      id: 'overdue',
      title: 'Просрочки',
      value: overdueLoans.length,
      subtitle: `${overduePercentage.toFixed(1)}% от активных`,
      icon: '⚠️',
      color: overduePercentage > 15 ? 'red' : 'amber',
      gradient: overduePercentage > 15 ? 'from-red-500 to-rose-600' : 'from-amber-500 to-orange-600',
    },
  ];

  const renderModalContent = () => {
    if (!modalType) return null;

    const filteredBooks = books.filter(b => 
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 10);

    const filteredReaders = readers.filter(r =>
      r.fio.toLowerCase().includes(search.toLowerCase()) ||
      r.group.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 10);

    const filteredLoans = activeLoans.filter(l => {
      const book = books.find(b => b.book_code === l.book_code);
      const reader = readers.find(r => r.reader_id === l.reader_id);
      return book?.title.toLowerCase().includes(search.toLowerCase()) ||
             reader?.fio.toLowerCase().includes(search.toLowerCase());
    }).slice(0, 10);

    const filteredOverdue = overdueLoans.filter(l => {
      const book = books.find(b => b.book_code === l.book_code);
      const reader = readers.find(r => r.reader_id === l.reader_id);
      return book?.title.toLowerCase().includes(search.toLowerCase()) ||
             reader?.fio.toLowerCase().includes(search.toLowerCase());
    }).slice(0, 10);

    switch (modalType) {
      case 'books':
        return (
          <div className="space-y-4">
            <Input
              placeholder="Поиск по названию или автору..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
            />
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {filteredBooks.map(book => (
                <div key={book.book_code} className="p-3 bg-slate-700/30 rounded-xl flex items-center gap-3">
                  <span className="text-2xl">📕</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{book.title}</p>
                    <p className="text-xs text-slate-400">{book.author}</p>
                  </div>
                  <Badge variant={book.isAvailable ? 'success' : 'warning'} size="sm">
                    {book.isAvailable ? 'Доступна' : 'Выдана'}
                  </Badge>
                </div>
              ))}
            </div>
            <button
              onClick={() => { onNavigate('catalog'); setModalType(null); }}
              className="w-full py-2 text-indigo-400 hover:text-indigo-300 text-sm font-medium"
            >
              Перейти к полному каталогу →
            </button>
          </div>
        );
      case 'readers':
        return (
          <div className="space-y-4">
            <Input
              placeholder="Поиск по ФИО или группе..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
            />
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {filteredReaders.map(reader => (
                <div key={reader.reader_id} className="p-3 bg-slate-700/30 rounded-xl flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {reader.fio.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{reader.fio}</p>
                    <p className="text-xs text-slate-400">{reader.group}</p>
                  </div>
                </div>
              ))}
            </div>
            {hasRole('admin', 'librarian') && (
              <button
                onClick={() => { onNavigate('readers'); setModalType(null); }}
                className="w-full py-2 text-indigo-400 hover:text-indigo-300 text-sm font-medium"
              >
                Перейти к списку читателей →
              </button>
            )}
          </div>
        );
      case 'loans':
        return (
          <div className="space-y-4">
            <Input
              placeholder="Поиск..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
            />
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {filteredLoans.map(loan => {
                const book = books.find(b => b.book_code === loan.book_code);
                const reader = readers.find(r => r.reader_id === loan.reader_id);
                return (
                  <div key={loan.loan_id} className="p-3 bg-slate-700/30 rounded-xl">
                    <p className="text-sm font-medium text-white">{book?.title}</p>
                    <p className="text-xs text-slate-400">{reader?.fio}</p>
                    <p className="text-xs text-slate-500 mt-1">До: {loan.due_date}</p>
                  </div>
                );
              })}
            </div>
            {hasRole('admin', 'librarian') && (
              <button
                onClick={() => { onNavigate('loans'); setModalType(null); }}
                className="w-full py-2 text-indigo-400 hover:text-indigo-300 text-sm font-medium"
              >
                Перейти к выдачам →
              </button>
            )}
          </div>
        );
      case 'overdue':
        return (
          <div className="space-y-4">
            <Input
              placeholder="Поиск..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
            />
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {filteredOverdue.map(loan => {
                const book = books.find(b => b.book_code === loan.book_code);
                const reader = readers.find(r => r.reader_id === loan.reader_id);
                const daysOverdue = Math.ceil((today.getTime() - new Date(loan.due_date).getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={loan.loan_id} className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white">{book?.title}</p>
                      <Badge variant="danger" size="sm">{daysOverdue} дн.</Badge>
                    </div>
                    <p className="text-xs text-slate-400">{reader?.fio}</p>
                  </div>
                );
              })}
            </div>
            {hasRole('admin', 'librarian') && (
              <button
                onClick={() => { onNavigate('overdue'); setModalType(null); }}
                className="w-full py-2 text-indigo-400 hover:text-indigo-300 text-sm font-medium"
              >
                Перейти к отчёту →
              </button>
            )}
          </div>
        );
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Service description card */}
      <div className="mb-8 bg-gradient-to-r from-indigo-900/50 via-purple-900/50 to-indigo-900/50 border border-indigo-500/30 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-3xl shadow-lg flex-shrink-0">
            📚
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white mb-2">Библиотечная система АБИС</h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-3">
              Автоматизированная библиотечно-информационная система для учёта каталога книг, 
              читателей, выдач и возвратов. Система позволяет контролировать просрочки, 
              формировать отчёты и обеспечивает интеграцию с платформой 1С:Предприятие.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-medium">
                📖 Каталог книг
              </span>
              <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium">
                👥 Учёт читателей
              </span>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-medium">
                📋 Выдачи и возвраты
              </span>
              <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-medium">
                📊 Отчёт просрочек
              </span>
              <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium">
                🔗 Интеграция 1С
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Добро пожаловать, {currentUser?.fullName.split(' ')[0]}!
        </h1>
        <p className="text-slate-400">
          {currentUser?.role === 'admin' && 'Полный доступ к управлению системой'}
          {currentUser?.role === 'librarian' && 'Управление выдачами и каталогом'}
          {currentUser?.role === 'reader' && 'Просмотр каталога и ваших выдач'}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card
            key={stat.id}
            hover
            glow={stat.color as 'indigo' | 'purple' | 'emerald' | 'amber' | 'red'}
            onClick={() => setModalType(stat.id as typeof modalType)}
            className="cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-slate-500 mt-1">{stat.subtitle}</p>
              </div>
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center text-xl shadow-lg`}>
                {stat.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* KPI section for admin/librarian */}
      {hasRole('admin', 'librarian') && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">KPI показатели</h2>
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-sm text-slate-400 mb-2">Целевой порог просрочек</p>
                <p className="text-2xl font-bold text-white">≤ 15%</p>
                <div className={`mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${overduePercentage <= 15 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                  {overduePercentage <= 15 ? '✓ В норме' : '✗ Превышен'}
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-400 mb-2">Текущий уровень</p>
                <p className={`text-2xl font-bold ${overduePercentage <= 15 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {overduePercentage.toFixed(1)}%
                </p>
                <p className="text-xs text-slate-500 mt-2">{overdueLoans.length} из {activeLoans.length} выдач</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-400 mb-2">Оборачиваемость фонда</p>
                <p className="text-2xl font-bold text-white">
                  {((books.length - availableBooks.length) / books.length * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-slate-500 mt-2">{books.length - availableBooks.length} книг в обращении</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Reader notifications */}
      {currentUser?.role === 'reader' && notifications.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Ваши уведомления</h2>
          <div className="space-y-3">
            {notifications.slice(0, 5).map((notif) => (
              <Card key={notif.id} className={notif.type === 'overdue' ? 'border-red-500/30 bg-red-500/5' : ''}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">
                    {notif.type === 'overdue' ? '🚨' : notif.type === 'one_day' ? '⚠️' : notif.type === 'three_days' ? '📅' : '📚'}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-white">{notif.title}</p>
                    <p className="text-sm text-slate-400">«{notif.bookTitle}»</p>
                    <p className="text-xs text-slate-500 mt-1">{notif.message}</p>
                  </div>
                  <Badge
                    variant={notif.type === 'overdue' ? 'danger' : notif.type === 'one_day' ? 'warning' : 'info'}
                    size="sm"
                  >
                    {notif.dueDate}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={!!modalType}
        onClose={() => { setModalType(null); setSearch(''); }}
        title={
          modalType === 'books' ? '📚 Книги' :
          modalType === 'readers' ? '👥 Читатели' :
          modalType === 'loans' ? '📖 Активные выдачи' :
          modalType === 'overdue' ? '⚠️ Просрочки' : ''
        }
        size="md"
      >
        {renderModalContent()}
      </Modal>
    </div>
  );
}
