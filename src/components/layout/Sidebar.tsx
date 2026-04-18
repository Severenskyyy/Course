import { cn } from '../../utils/cn';
import { useApp } from '../../context/AppContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
  currentPage: string;
}

const menuItems = [
  { id: 'home', label: 'Главная', icon: '🏠', description: 'Обзор системы', roles: ['admin', 'librarian', 'reader'] },
  { id: 'catalog', label: 'Каталог книг', icon: '📚', description: 'Просмотр и поиск книг', roles: ['admin', 'librarian', 'reader'] },
  { id: 'readers', label: 'Читатели', icon: '👥', description: 'Управление читателями', roles: ['admin', 'librarian'] },
  { id: 'loans', label: 'Выдачи', icon: '📖', description: 'Учёт выдач и возвратов', roles: ['admin', 'librarian'] },
  { id: 'overdue', label: 'Просрочки', icon: '⚠️', description: 'Отчёт о просрочках', roles: ['admin', 'librarian'] },
  { id: 'integration', label: 'Интеграция 1С', icon: '🔗', description: 'Обмен данными с 1С', roles: ['admin'] },
  { id: 'settings', label: 'Настройки', icon: '⚙️', description: 'Параметры системы', roles: ['admin'] },
];

export function Sidebar({ isOpen, onClose, onNavigate, currentPage }: SidebarProps) {
  const { currentUser, hasRole } = useApp();

  const filteredItems = menuItems.filter(item => 
    item.roles.some(role => hasRole(role as 'admin' | 'librarian' | 'reader'))
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={cn(
          'fixed top-0 left-0 h-full w-80 bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 z-50',
          'transform transition-transform duration-300 ease-out',
          'flex flex-col',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-xl">📚</span>
              </div>
              <div>
                <h2 className="font-bold text-white">Библиотека АБИС</h2>
                <p className="text-xs text-slate-400">Система учёта</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* User info */}
        {currentUser && (
          <div className="p-4 mx-4 mt-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {currentUser.fullName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{currentUser.fullName}</p>
                <p className="text-xs text-slate-400 capitalize">
                  {currentUser.role === 'admin' ? 'Администратор' : 
                   currentUser.role === 'librarian' ? 'Библиотекарь' : 'Читатель'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left',
                  'transition-all duration-200 group',
                  currentPage === item.id
                    ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/30 text-white border border-indigo-500/30'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                )}
              >
                <span className="text-xl group-hover:scale-110 transition-transform duration-200">
                  {item.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-xs text-slate-400 truncate">{item.description}</p>
                </div>
                {currentPage === item.id && (
                  <div className="w-1.5 h-8 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700/50">
          <div className="text-xs text-slate-500 text-center">
            <p>Версия 1.0.0</p>
            <p className="mt-1">© 2024 Библиотека АБИС</p>
          </div>
        </div>
      </div>
    </>
  );
}
