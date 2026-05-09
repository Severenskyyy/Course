import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function LoginPage() {
  const { login } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate loading
    await new Promise(r => setTimeout(r, 500));

    if (login(username, password)) {
      setLoading(false);
    } else {
      setError('Неверный логин или пароль');
      setLoading(false);
    }
  };

  const demoAccounts = [
    { username: 'admin', password: 'admin123', role: 'Администратор', icon: '👑' },
    { username: 'librarian', password: 'lib123', role: 'Библиотекарь', icon: '📚' },
    { username: 'reader', password: 'reader123', role: 'Читатель', icon: '👤' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/30 mb-4">
            <span className="text-3xl">📚</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Библиотека АБИС</h1>
          <p className="text-slate-400 mt-1">Автоматизированная библиотечно-информационная система</p>
        </div>

        {/* Login form */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6">Вход в систему</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Логин"
              type="text"
              placeholder="Введите логин"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            />

            <Input
              label="Пароль"
              type="password"
              placeholder="Введите пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={error}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
            />

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Войти
            </Button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8 pt-6 border-t border-slate-700/50">
            <p className="text-sm text-slate-400 text-center mb-4">Демо-аккаунты для тестирования</p>
            <div className="grid grid-cols-1 gap-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.username}
                  onClick={() => {
                    setUsername(account.username);
                    setPassword(account.password);
                    setError('');
                  }}
                  className="flex items-center gap-3 p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-xl transition-all duration-200 group"
                >
                  <span className="text-xl group-hover:scale-110 transition-transform">{account.icon}</span>
                  <div className="text-left flex-1">
                    <p className="text-sm font-medium text-white">{account.role}</p>
                    <p className="text-xs text-slate-400">{account.username} / {account.password}</p>
                  </div>
                  <svg className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-sm mt-6">
          Учебный проект · Интеграция с 1С:Предприятие
        </p>
      </div>
    </div>
  );
}
