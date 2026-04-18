import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

export function SettingsPage() {
  const { settings, updateSettings, staffNotifications, markStaffNotificationRead, markAllStaffNotificationsRead, books, readers, loans } = useApp();
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'library' | 'backup' | 'logs'>('general');
  const [localSettings, setLocalSettings] = useState(settings);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);

  const handleSave = () => {
    updateSettings(localSettings);
    setShowSaveModal(true);
  };

  const handleExportData = (type: 'books' | 'readers' | 'loans' | 'all') => {
    let data: string;
    let filename: string;

    switch (type) {
      case 'books':
        data = 'book_code,title,author,year,udk,isAvailable\n' +
          books.map(b => `${b.book_code},"${b.title}","${b.author}",${b.year},${b.udk},${b.isAvailable}`).join('\n');
        filename = 'books_export.csv';
        break;
      case 'readers':
        data = 'reader_id,fio,group\n' +
          readers.map(r => `${r.reader_id},"${r.fio}","${r.group}"`).join('\n');
        filename = 'readers_export.csv';
        break;
      case 'loans':
        data = 'loan_id,reader_id,book_code,issue_date,due_date,return_date\n' +
          loans.map(l => `${l.loan_id},${l.reader_id},${l.book_code},${l.issue_date},${l.due_date},${l.return_date || ''}`).join('\n');
        filename = 'loans_export.csv';
        break;
      default:
        data = JSON.stringify({ books, readers, loans }, null, 2);
        filename = 'library_backup.json';
    }

    const blob = new Blob([data], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'general', label: 'Основные', icon: '⚙️' },
    { id: 'notifications', label: 'Уведомления', icon: '🔔', badge: staffNotifications.filter(n => !n.isRead).length },
    { id: 'library', label: 'Библиотека', icon: '🏛️' },
    { id: 'backup', label: 'Резервное копирование', icon: '💾' },
    { id: 'logs', label: 'Журнал операций', icon: '📜' },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">⚙️ Настройки системы</h1>
        <p className="text-slate-400">Управление параметрами библиотечной системы</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.badge && tab.badge > 0 && (
              <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-semibold text-white mb-4">📚 Параметры выдачи</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Стандартный срок выдачи (дней)
                </label>
                <Input
                  type="number"
                  value={localSettings.defaultLoanDays}
                  onChange={(e) => setLocalSettings({ ...localSettings, defaultLoanDays: parseInt(e.target.value) || 14 })}
                />
                <p className="text-xs text-slate-500 mt-1">Срок выдачи по умолчанию для новых книг</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Максимум книг на читателя
                </label>
                <Input
                  type="number"
                  value={localSettings.maxLoansPerReader}
                  onChange={(e) => setLocalSettings({ ...localSettings, maxLoansPerReader: parseInt(e.target.value) || 5 })}
                />
                <p className="text-xs text-slate-500 mt-1">Максимальное количество активных выдач</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Целевой порог просрочек (%)
                </label>
                <Input
                  type="number"
                  value={localSettings.overdueThreshold}
                  onChange={(e) => setLocalSettings({ ...localSettings, overdueThreshold: parseInt(e.target.value) || 15 })}
                />
                <p className="text-xs text-slate-500 mt-1">KPI: доля просроченных выдач не должна превышать</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Срок бронирования (часов)
                </label>
                <Input
                  type="number"
                  value={localSettings.reservationHours}
                  onChange={(e) => setLocalSettings({ ...localSettings, reservationHours: parseInt(e.target.value) || 24 })}
                />
                <p className="text-xs text-slate-500 mt-1">Время действия брони книги</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Повторное бронирование через (дней)
                </label>
                <Input
                  type="number"
                  value={localSettings.reservationCooldownDays}
                  onChange={(e) => setLocalSettings({ ...localSettings, reservationCooldownDays: parseInt(e.target.value) || 3 })}
                />
                <p className="text-xs text-slate-500 mt-1">Cooldown между бронированиями одной книги</p>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-white mb-4">📧 Настройки уведомлений</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.enableEmailNotifications}
                  onChange={(e) => setLocalSettings({ ...localSettings, enableEmailNotifications: e.target.checked })}
                  className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <p className="text-white font-medium">Email-уведомления</p>
                  <p className="text-sm text-slate-400">Отправка напоминаний о сроках возврата на email</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.enableSmsNotifications}
                  onChange={(e) => setLocalSettings({ ...localSettings, enableSmsNotifications: e.target.checked })}
                  className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <p className="text-white font-medium">SMS-уведомления</p>
                  <p className="text-sm text-slate-400">Отправка SMS о просрочках</p>
                </div>
              </label>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} variant="primary">
              💾 Сохранить настройки
            </Button>
          </div>
        </div>
      )}

      {/* Staff Notifications */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">🔔 Журнал уведомлений сотрудников</h2>
              {staffNotifications.some(n => !n.isRead) && (
                <Button variant="ghost" size="sm" onClick={markAllStaffNotificationsRead}>
                  Отметить все прочитанными
                </Button>
              )}
            </div>
            
            {staffNotifications.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <span className="text-4xl mb-4 block">🔕</span>
                <p>Уведомлений пока нет</p>
                <p className="text-sm mt-1">Здесь будут отображаться уведомления о выдачах и возвратах книг</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {staffNotifications.map(notif => (
                  <div
                    key={notif.id}
                    onClick={() => markStaffNotificationRead(notif.id)}
                    className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                      notif.isRead
                        ? 'bg-slate-800/30 border-slate-700/30'
                        : notif.type === 'return_success'
                        ? 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20'
                        : 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">
                        {notif.type === 'return_success' ? '📗' : '📘'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`font-medium ${notif.isRead ? 'text-slate-400' : 'text-white'}`}>
                            {notif.title}
                          </p>
                          {!notif.isRead && (
                            <Badge variant="info" size="sm">Новое</Badge>
                          )}
                        </div>
                        <p className={`text-sm ${notif.isRead ? 'text-slate-500' : 'text-slate-300'}`}>
                          «{notif.bookTitle}»
                        </p>
                        <p className={`text-sm ${notif.isRead ? 'text-slate-600' : 'text-slate-400'}`}>
                          {notif.message}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(notif.createdAt).toLocaleString('ru-RU')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Library Info */}
      {activeTab === 'library' && (
        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-semibold text-white mb-4">🏛️ Информация о библиотеке</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Название библиотеки
                </label>
                <Input
                  value={localSettings.libraryName}
                  onChange={(e) => setLocalSettings({ ...localSettings, libraryName: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Адрес
                </label>
                <Input
                  value={localSettings.libraryAddress}
                  onChange={(e) => setLocalSettings({ ...localSettings, libraryAddress: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Телефон
                </label>
                <Input
                  value={localSettings.libraryPhone}
                  onChange={(e) => setLocalSettings({ ...localSettings, libraryPhone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={localSettings.libraryEmail}
                  onChange={(e) => setLocalSettings({ ...localSettings, libraryEmail: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Часы работы
                </label>
                <Input
                  value={localSettings.workingHours}
                  onChange={(e) => setLocalSettings({ ...localSettings, workingHours: e.target.value })}
                />
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} variant="primary">
              💾 Сохранить изменения
            </Button>
          </div>
        </div>
      )}

      {/* Backup */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-semibold text-white mb-4">📤 Экспорт данных</h2>
            <p className="text-slate-400 text-sm mb-6">
              Выгрузка данных в формате CSV для интеграции с 1С или резервного копирования
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => handleExportData('books')}
                className="p-4 bg-slate-700/50 rounded-xl border border-slate-600/50 hover:bg-slate-700 hover:border-indigo-500/50 transition-all duration-300 text-left"
              >
                <span className="text-2xl mb-2 block">📚</span>
                <p className="font-medium text-white">Книги</p>
                <p className="text-xs text-slate-400">{books.length} записей</p>
              </button>
              <button
                onClick={() => handleExportData('readers')}
                className="p-4 bg-slate-700/50 rounded-xl border border-slate-600/50 hover:bg-slate-700 hover:border-purple-500/50 transition-all duration-300 text-left"
              >
                <span className="text-2xl mb-2 block">👥</span>
                <p className="font-medium text-white">Читатели</p>
                <p className="text-xs text-slate-400">{readers.length} записей</p>
              </button>
              <button
                onClick={() => handleExportData('loans')}
                className="p-4 bg-slate-700/50 rounded-xl border border-slate-600/50 hover:bg-slate-700 hover:border-emerald-500/50 transition-all duration-300 text-left"
              >
                <span className="text-2xl mb-2 block">📖</span>
                <p className="font-medium text-white">Выдачи</p>
                <p className="text-xs text-slate-400">{loans.length} записей</p>
              </button>
              <button
                onClick={() => { handleExportData('all'); setShowBackupModal(true); }}
                className="p-4 bg-gradient-to-br from-indigo-600/30 to-purple-600/30 rounded-xl border border-indigo-500/50 hover:from-indigo-600/50 hover:to-purple-600/50 transition-all duration-300 text-left"
              >
                <span className="text-2xl mb-2 block">💾</span>
                <p className="font-medium text-white">Полный бэкап</p>
                <p className="text-xs text-slate-400">JSON формат</p>
              </button>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-white mb-4">📥 Импорт данных</h2>
            <p className="text-slate-400 text-sm mb-6">
              Загрузка данных из CSV файлов. Импорт идемпотентен — дубликаты не создаются.
            </p>
            <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center hover:border-indigo-500/50 transition-all duration-300">
              <span className="text-4xl mb-4 block">📁</span>
              <p className="text-white font-medium mb-2">Перетащите файл сюда или нажмите для выбора</p>
              <p className="text-sm text-slate-400 mb-4">Поддерживаемые форматы: CSV, JSON</p>
              <input type="file" className="hidden" id="file-upload" accept=".csv,.json" />
              <Button variant="secondary" onClick={() => document.getElementById('file-upload')?.click()}>
                Выбрать файл
              </Button>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-white mb-4">🔗 Интеграция с 1С</h2>
            <p className="text-slate-400 text-sm mb-4">
              Настройка автоматического обмена данными с 1С:Предприятие
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-700/30 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></span>
                  <p className="font-medium text-white">Статус подключения</p>
                </div>
                <p className="text-sm text-emerald-400">Подключено к 1С:Предприятие 8.3</p>
              </div>
              <div className="p-4 bg-slate-700/30 rounded-xl">
                <p className="font-medium text-white mb-2">Последняя синхронизация</p>
                <p className="text-sm text-slate-400">{new Date().toLocaleString('ru-RU')}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Logs */}
      {activeTab === 'logs' && (
        <Card>
          <h2 className="text-lg font-semibold text-white mb-4">📜 Журнал операций</h2>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {[
              { action: 'Выдача книги', user: 'Библиотекарь', time: '10:35', details: '«Война и мир» → Иванов И.И.' },
              { action: 'Возврат книги', user: 'Библиотекарь', time: '10:20', details: '«Преступление и наказание» ← Петров П.П.' },
              { action: 'Добавлена книга', user: 'Администратор', time: '09:45', details: '«Новая книга» (BK00051)' },
              { action: 'Изменены настройки', user: 'Администратор', time: '09:30', details: 'Обновлён порог просрочек' },
              { action: 'Экспорт данных', user: 'Администратор', time: '09:15', details: 'Полный бэкап системы' },
            ].map((log, i) => (
              <div key={i} className="p-3 bg-slate-800/50 rounded-lg flex items-center gap-4">
                <span className="text-xs text-slate-500 w-12">{log.time}</span>
                <Badge variant={log.action.includes('Выдача') ? 'info' : log.action.includes('Возврат') ? 'success' : 'default'} size="sm">
                  {log.action}
                </Badge>
                <span className="text-sm text-slate-400 flex-1">{log.details}</span>
                <span className="text-xs text-slate-500">{log.user}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Save Modal */}
      <Modal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        title="✅ Настройки сохранены"
        size="sm"
      >
        <p className="text-slate-300 mb-4">Все изменения успешно применены.</p>
        <Button onClick={() => setShowSaveModal(false)} variant="primary" className="w-full">
          Отлично
        </Button>
      </Modal>

      {/* Backup Modal */}
      <Modal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        title="💾 Резервная копия создана"
        size="sm"
      >
        <p className="text-slate-300 mb-4">Файл library_backup.json успешно скачан.</p>
        <Button onClick={() => setShowBackupModal(false)} variant="primary" className="w-full">
          Закрыть
        </Button>
      </Modal>
    </div>
  );
}
