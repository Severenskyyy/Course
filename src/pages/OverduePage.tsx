import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Dropdown } from '../components/ui/Dropdown';

export function OverduePage() {
  const { loans, books, readers, getBookByCode, getReaderById } = useApp();
  const [groupFilter, setGroupFilter] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [minDays, setMinDays] = useState('');
  const [maxDays, setMaxDays] = useState('');

  const today = new Date();

  // Calculate overdue data
  const overdueData = useMemo(() => {
    const activeLoans = loans.filter(l => !l.return_date);
    const overdueLoans = activeLoans.filter(l => new Date(l.due_date) < today);

    const items = overdueLoans.map(loan => {
      const book = getBookByCode(loan.book_code);
      const reader = getReaderById(loan.reader_id);
      const dueDate = new Date(loan.due_date);
      const daysOverdue = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      return {
        loan_id: loan.loan_id,
        reader_id: loan.reader_id,
        fio: reader?.fio || '',
        group: reader?.group || '',
        book_code: loan.book_code,
        title: book?.title || '',
        author: book?.author || '',
        issue_date: loan.issue_date,
        due_date: loan.due_date,
        days_overdue: daysOverdue,
      };
    });

    // Apply filters
    const filtered = items.filter(item => {
      const matchesGroup = !groupFilter || item.group === groupFilter;
      const matchesAuthor = !authorFilter || item.author === authorFilter;
      const matchesMinDays = !minDays || item.days_overdue >= parseInt(minDays);
      const matchesMaxDays = !maxDays || item.days_overdue <= parseInt(maxDays);
      return matchesGroup && matchesAuthor && matchesMinDays && matchesMaxDays;
    });

    // Calculate statistics
    const daysList = filtered.map(i => i.days_overdue);
    const avgDays = daysList.length > 0 ? daysList.reduce((a, b) => a + b, 0) / daysList.length : 0;
    const sortedDays = [...daysList].sort((a, b) => a - b);
    const medianDays = sortedDays.length > 0 
      ? sortedDays.length % 2 === 0 
        ? (sortedDays[sortedDays.length / 2 - 1] + sortedDays[sortedDays.length / 2]) / 2
        : sortedDays[Math.floor(sortedDays.length / 2)]
      : 0;

    // Top readers
    const readerStats: Record<string, { fio: string; group: string; count: number; totalDays: number }> = {};
    filtered.forEach(item => {
      if (!readerStats[item.reader_id]) {
        readerStats[item.reader_id] = { fio: item.fio, group: item.group, count: 0, totalDays: 0 };
      }
      readerStats[item.reader_id].count++;
      readerStats[item.reader_id].totalDays += item.days_overdue;
    });
    const topReaders = Object.entries(readerStats)
      .map(([id, data]) => ({ reader_id: id, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top books
    const bookStats: Record<string, { title: string; author: string; count: number; totalDays: number }> = {};
    filtered.forEach(item => {
      if (!bookStats[item.book_code]) {
        bookStats[item.book_code] = { title: item.title, author: item.author, count: 0, totalDays: 0 };
      }
      bookStats[item.book_code].count++;
      bookStats[item.book_code].totalDays += item.days_overdue;
    });
    const topBooks = Object.entries(bookStats)
      .map(([code, data]) => ({ book_code: code, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      items: filtered.sort((a, b) => b.days_overdue - a.days_overdue),
      totalOverdue: overdueLoans.length,
      totalActive: activeLoans.length,
      overduePercentage: activeLoans.length > 0 ? (overdueLoans.length / activeLoans.length * 100) : 0,
      avgDays,
      medianDays,
      topReaders,
      topBooks,
    };
  }, [loans, books, readers, groupFilter, authorFilter, minDays, maxDays]);

  // Filter options
  const groups = [...new Set(readers.map(r => r.group))].sort();
  const authors = [...new Set(books.map(b => b.author))].sort();

  const groupOptions = [
    { value: '', label: 'Все группы' },
    ...groups.map(g => ({ value: g, label: g }))
  ];

  const authorOptions = [
    { value: '', label: 'Все авторы' },
    ...authors.map(a => ({ value: a, label: a }))
  ];

  const exportCSV = () => {
    const headers = ['reader_id', 'fio', 'group', 'book_code', 'title', 'author', 'issue_date', 'due_date', 'days_overdue'];
    const rows = overdueData.items.map(item => [
      item.reader_id,
      item.fio,
      item.group,
      item.book_code,
      item.title,
      item.author,
      item.issue_date,
      item.due_date,
      item.days_overdue,
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';')),
      '',
      `Всего просрочек;${overdueData.totalOverdue}`,
      `Процент просрочек;${overdueData.overduePercentage.toFixed(2)}%`,
      `Средняя просрочка;${overdueData.avgDays.toFixed(1)} дн.`,
      `Медианная просрочка;${overdueData.medianDays} дн.`,
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `overdue_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Отчёт о просрочках</h1>
          <p className="text-slate-400">Анализ просроченных выдач</p>
        </div>
        <Button onClick={exportCSV} variant="secondary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Экспорт CSV
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <p className="text-sm text-slate-400">Всего просрочек</p>
          <p className="text-3xl font-bold text-red-400">{overdueData.totalOverdue}</p>
          <p className="text-xs text-slate-500 mt-1">из {overdueData.totalActive} активных</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-400">Процент просрочек</p>
          <p className={`text-3xl font-bold ${overdueData.overduePercentage <= 15 ? 'text-emerald-400' : 'text-red-400'}`}>
            {overdueData.overduePercentage.toFixed(1)}%
          </p>
          <p className="text-xs text-slate-500 mt-1">целевой порог ≤ 15%</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-400">Средняя просрочка</p>
          <p className="text-3xl font-bold text-amber-400">{overdueData.avgDays.toFixed(1)}</p>
          <p className="text-xs text-slate-500 mt-1">дней</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-400">Медианная просрочка</p>
          <p className="text-3xl font-bold text-white">{overdueData.medianDays}</p>
          <p className="text-xs text-slate-500 mt-1">дней</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <h3 className="text-sm font-medium text-slate-400 mb-4">Фильтры</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Dropdown
            options={groupOptions}
            value={groupFilter}
            onChange={setGroupFilter}
            placeholder="Группа"
            searchable
          />
          <Dropdown
            options={authorOptions}
            value={authorFilter}
            onChange={setAuthorFilter}
            placeholder="Автор"
            searchable
          />
          <div className="flex gap-2 items-center">
            <input
              type="number"
              placeholder="От"
              value={minDays}
              onChange={(e) => setMinDays(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2 text-white"
              min="0"
            />
            <span className="text-slate-500">—</span>
            <input
              type="number"
              placeholder="До"
              value={maxDays}
              onChange={(e) => setMaxDays(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2 text-white"
              min="0"
            />
            <span className="text-slate-400 whitespace-nowrap">дней</span>
          </div>
          <Button
            variant="ghost"
            onClick={() => {
              setGroupFilter('');
              setAuthorFilter('');
              setMinDays('');
              setMaxDays('');
            }}
          >
            Сбросить
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Top readers */}
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">ТОП-5 читателей</h3>
          <div className="space-y-3">
            {overdueData.topReaders.map((reader, idx) => (
              <div key={reader.reader_id} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  idx === 0 ? 'bg-red-500' : idx === 1 ? 'bg-orange-500' : 'bg-slate-600'
                } text-white`}>
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{reader.fio}</p>
                  <p className="text-xs text-slate-500">{reader.group}</p>
                </div>
                <Badge variant="danger" size="sm">{reader.count} шт.</Badge>
              </div>
            ))}
            {overdueData.topReaders.length === 0 && (
              <p className="text-slate-400 text-sm text-center py-4">Нет данных</p>
            )}
          </div>
        </Card>

        {/* Top books */}
        <Card className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-4">ТОП-5 книг по просрочкам</h3>
          <div className="space-y-3">
            {overdueData.topBooks.map((book, idx) => (
              <div key={book.book_code} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  idx === 0 ? 'bg-red-500' : idx === 1 ? 'bg-orange-500' : 'bg-slate-600'
                } text-white`}>
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{book.title}</p>
                  <p className="text-xs text-slate-500">{book.author}</p>
                </div>
                <Badge variant="danger" size="sm">{book.count} просрочек</Badge>
              </div>
            ))}
            {overdueData.topBooks.length === 0 && (
              <p className="text-slate-400 text-sm text-center py-4">Нет данных</p>
            )}
          </div>
        </Card>
      </div>

      {/* Overdue table */}
      <Card className="overflow-hidden p-0">
        <div className="p-4 border-b border-slate-700/50">
          <h3 className="text-lg font-semibold text-white">Детализация просрочек ({overdueData.items.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/30">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Читатель</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Группа</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Книга</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Выдана</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Срок</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Просрочка</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {overdueData.items.map(item => (
                <tr key={item.loan_id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-white">{item.fio}</p>
                    <p className="text-xs text-slate-500">{item.reader_id}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{item.group}</td>
                  <td className="px-4 py-3">
                    <p className="text-white">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.author}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{item.issue_date}</td>
                  <td className="px-4 py-3 text-slate-300">{item.due_date}</td>
                  <td className="px-4 py-3">
                    <Badge variant="danger">{item.days_overdue} дн.</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
