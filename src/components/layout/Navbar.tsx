import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { cn } from '../../utils/cn';

interface NavbarProps {
  onMenuClick: () => void;
  onNavigate: (page: string) => void;
}

export function Navbar({ onMenuClick, onNavigate }: NavbarProps) {
  const { 
    currentUser, 
    logout, 
    notifications, 
    staffNotifications,
    markNotificationRead, 
    markAllNotificationsRead,
    markStaffNotificationRead,
    markAllStaffNotificationsRead
  } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Определяем уведомления в зависимости от роли
  const isReader = currentUser?.role === 'reader';
  const currentNotifications = isReader ? notifications : staffNotifications;
  const unreadCount = currentNotifications.filter(n => !n.isRead).length;
  const handleMarkRead = isReader ? markNotificationRead : markStaffNotificationRead;
  const handleMarkAllRead = isReader ? markAllNotificationsRead : markAllStaffNotificationsRead;

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left: Menu button & Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2 group"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                <span className="text-sm">📚</span>
              </div>
              <span className="font-bold text-white hidden sm:block">Библиотека АБИС</span>
            </button>
          </div>

          {/* Right: Notifications & User */}
          <div className="flex items-center gap-2">
            {/* Notifications - for all users */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="p-3 border-b border-slate-700 flex items-center justify-between">
                    <h3 className="font-semibold text-white">
                      {isReader ? 'Уведомления' : 'Журнал операций'}
                    </h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-indigo-400 hover:text-indigo-300"
                      >
                        Прочитать все
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {currentNotifications.length === 0 ? (
                      <div className="p-4 text-center text-slate-400">
                        <p className="text-2xl mb-2">📭</p>
                        <p className="text-sm">{isReader ? 'Нет уведомлений' : 'Нет операций'}</p>
                      </div>
                    ) : (
                      currentNotifications.slice(0, 10).map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleMarkRead(notif.id)}
                          className={cn(
                            'p-3 border-b border-slate-700/50 cursor-pointer transition-colors',
                            notif.isRead ? 'bg-slate-800/50' : 'bg-slate-700/30 hover:bg-slate-700/50'
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-lg">{
                              notif.type === 'overdue' ? '🚨' :
                              notif.type === 'one_day' ? '⚠️' :
                              notif.type === 'three_days' ? '📅' :
                              notif.type === 'issue_success' ? '📘' :
                              notif.type === 'return_success' ? '📗' : '📚'
                            }</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white">{notif.title}</p>
                              {notif.bookTitle && (
                                <p className="text-xs text-slate-400 truncate">«{notif.bookTitle}»</p>
                              )}
                              <p className="text-xs text-slate-500 mt-1">{notif.message}</p>
                            </div>
                            {!notif.isRead && (
                              <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative" ref={userRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 hover:bg-slate-700/50 rounded-lg transition-all duration-200"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {currentUser?.fullName.charAt(0) || '?'}
                </div>
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="p-3 border-b border-slate-700">
                    <p className="text-sm font-medium text-white truncate">{currentUser?.fullName}</p>
                    <p className="text-xs text-slate-400 capitalize">
                      {currentUser?.role === 'admin' ? 'Администратор' : 
                       currentUser?.role === 'librarian' ? 'Библиотекарь' : 'Читатель'}
                    </p>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={() => {
                        onNavigate('profile');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Личный кабинет
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Выйти
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
