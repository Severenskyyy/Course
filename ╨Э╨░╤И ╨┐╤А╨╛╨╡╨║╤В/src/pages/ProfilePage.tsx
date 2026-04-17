import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export function ProfilePage() {
  const { currentUser, books, loans, reservations, notifications } = useApp();

  if (!currentUser) return null;

  const myLoans = currentUser.readerId 
    ? loans.filter(l => l.reader_id === currentUser.readerId)
    : [];
  
  const activeLoans = myLoans.filter(l => !l.return_date);
  const returnedLoans = myLoans.filter(l => l.return_date);
  
  const today = new Date();
  const overdueLoans = activeLoans.filter(l => new Date(l.due_date) < today);
  
  const myReservations = currentUser.readerId
    ? reservations.filter(r => r.reader_id === currentUser.readerId && r.is_active)
    : [];

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin': return 'Администратор';
      case 'librarian': return 'Библиотекарь';
      case 'reader': return 'Читатель';
      default: return role;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Личный кабинет</h1>

      {/* Информация о пользователе */}
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
            {currentUser.fullName.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">{currentUser.fullName}</h2>
            <p className="text-slate-400">{getRoleName(currentUser.role)}</p>
            {currentUser.readerId && (
              <p className="text-sm text-slate-500">ID: {currentUser.readerId}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Для читателя - показываем его книги */}
      {currentUser.role === 'reader' && (
        <>
          {/* Уведомления */}
          {notifications.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">🔔 Уведомления</h3>
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <Card 
                    key={notif.id} 
                    className={notif.type === 'overdue' ? 'border-red-500/30 bg-red-500/5' : ''}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">
                        {notif.type === 'overdue' ? '🚨' : 
                         notif.type === 'one_day' ? '⚠️' : 
                         notif.type === 'three_days' ? '📅' : '📚'}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-white">{notif.title}</p>
                        <p className="text-sm text-slate-400">«{notif.bookTitle}»</p>
                        <p className="text-xs text-slate-500 mt-1">{notif.message}</p>
                      </div>
                      <Badge
                        variant={notif.type === 'overdue' ? 'danger' : 
                                notif.type === 'one_day' ? 'warning' : 'info'}
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

          {/* Статистика */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <Card>
              <p className="text-sm text-slate-400">Книг на руках</p>
              <p className="text-2xl font-bold text-white">{activeLoans.length}</p>
            </Card>
            <Card>
              <p className="text-sm text-slate-400">Просрочено</p>
              <p className={`text-2xl font-bold ${overdueLoans.length > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {overdueLoans.length}
              </p>
            </Card>
            <Card>
              <p className="text-sm text-slate-400">Возвращено</p>
              <p className="text-2xl font-bold text-white">{returnedLoans.length}</p>
            </Card>
            <Card>
              <p className="text-sm text-slate-400">Бронирований</p>
              <p className="text-2xl font-bold text-indigo-400">{myReservations.length}</p>
            </Card>
          </div>

          {/* Активные выдачи */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">📚 Книги на руках</h3>
            {activeLoans.length === 0 ? (
              <Card>
                <p className="text-slate-400 text-center py-4">У вас нет книг на руках</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {activeLoans.map(loan => {
                  const book = books.find(b => b.book_code === loan.book_code);
                  const dueDate = new Date(loan.due_date);
                  const isOverdue = dueDate < today;
                  const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <Card key={loan.loan_id} className={isOverdue ? 'border-red-500/30' : ''}>
                      <div className="flex items-center gap-4">
                        <div className="text-3xl">📕</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{book?.title}</p>
                          <p className="text-sm text-slate-400">{book?.author}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-400">Срок: {loan.due_date}</p>
                          {isOverdue ? (
                            <Badge variant="danger" size="sm">
                              Просрочка {Math.abs(daysLeft)} дн.
                            </Badge>
                          ) : (
                            <Badge variant={daysLeft <= 3 ? 'warning' : 'success'} size="sm">
                              Осталось {daysLeft} дн.
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Бронирования */}
          {myReservations.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">🔖 Мои бронирования</h3>
              <div className="space-y-3">
                {myReservations.map(res => {
                  const book = books.find(b => b.book_code === res.book_code);
                  const expiresAt = new Date(res.expires_at);
                  const hoursLeft = Math.ceil((expiresAt.getTime() - today.getTime()) / (1000 * 60 * 60));
                  
                  return (
                    <Card key={res.reservation_id}>
                      <div className="flex items-center gap-4">
                        <div className="text-3xl">🔖</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{book?.title}</p>
                          <p className="text-sm text-slate-400">{book?.author}</p>
                        </div>
                        <Badge variant={hoursLeft <= 6 ? 'warning' : 'info'} size="sm">
                          Истекает через {hoursLeft} ч.
                        </Badge>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* История */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">📜 История возвратов</h3>
            {returnedLoans.length === 0 ? (
              <Card>
                <p className="text-slate-400 text-center py-4">История пуста</p>
              </Card>
            ) : (
              <Card className="overflow-hidden p-0">
                <table className="w-full">
                  <thead className="bg-slate-700/30">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs text-slate-400">Книга</th>
                      <th className="px-4 py-2 text-left text-xs text-slate-400">Выдана</th>
                      <th className="px-4 py-2 text-left text-xs text-slate-400">Возвращена</th>
                      <th className="px-4 py-2 text-left text-xs text-slate-400">Статус</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {returnedLoans.slice(0, 10).map(loan => {
                      const book = books.find(b => b.book_code === loan.book_code);
                      const wasOverdue = loan.return_date && new Date(loan.return_date) > new Date(loan.due_date);
                      
                      return (
                        <tr key={loan.loan_id} className="hover:bg-slate-700/20">
                          <td className="px-4 py-3 text-white">{book?.title}</td>
                          <td className="px-4 py-3 text-slate-400">{loan.issue_date}</td>
                          <td className="px-4 py-3 text-slate-400">{loan.return_date}</td>
                          <td className="px-4 py-3">
                            <Badge variant={wasOverdue ? 'warning' : 'success'} size="sm">
                              {wasOverdue ? 'С просрочкой' : 'Вовремя'}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
            )}
          </div>
        </>
      )}

      {/* Для админа/библиотекаря */}
      {currentUser.role !== 'reader' && (
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Функции {getRoleName(currentUser.role)}а</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-700/30 rounded-xl">
              <p className="text-white font-medium">📚 Управление каталогом</p>
              <p className="text-sm text-slate-400 mt-1">Добавление, редактирование и удаление книг</p>
            </div>
            <div className="p-4 bg-slate-700/30 rounded-xl">
              <p className="text-white font-medium">👥 Управление читателями</p>
              <p className="text-sm text-slate-400 mt-1">Регистрация и редактирование читателей</p>
            </div>
            <div className="p-4 bg-slate-700/30 rounded-xl">
              <p className="text-white font-medium">📖 Выдача и возврат</p>
              <p className="text-sm text-slate-400 mt-1">Оформление выдач и приём возвратов</p>
            </div>
            <div className="p-4 bg-slate-700/30 rounded-xl">
              <p className="text-white font-medium">📊 Отчёты</p>
              <p className="text-sm text-slate-400 mt-1">Просмотр просрочек и статистики</p>
            </div>
            {currentUser.role === 'admin' && (
              <>
                <div className="p-4 bg-slate-700/30 rounded-xl">
                  <p className="text-white font-medium">🔗 Интеграция 1С</p>
                  <p className="text-sm text-slate-400 mt-1">Импорт и экспорт данных</p>
                </div>
                <div className="p-4 bg-slate-700/30 rounded-xl">
                  <p className="text-white font-medium">⚙️ Настройки</p>
                  <p className="text-sm text-slate-400 mt-1">Конфигурация системы</p>
                </div>
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
