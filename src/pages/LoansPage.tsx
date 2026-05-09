import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Dropdown } from '../components/ui/Dropdown';
import { ConfirmDialog } from '../components/ui/Modal';

export function LoansPage() {
  const { loans, books, readers, returnLoan, issueLoan, getBookByCode, getReaderById } = useApp();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [confirmReturn, setConfirmReturn] = useState<string | null>(null);
  const [showNewLoan, setShowNewLoan] = useState(false);
  const [newLoanData, setNewLoanData] = useState({ readerId: '', bookCode: '', dueDate: '' });
  const [confirmNewLoan, setConfirmNewLoan] = useState(false);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Filter loans
  const filteredLoans = loans.filter(loan => {
    const book = getBookByCode(loan.book_code);
    const reader = getReaderById(loan.reader_id);
    
    const matchesSearch = !search ||
      book?.title.toLowerCase().includes(search.toLowerCase()) ||
      reader?.fio.toLowerCase().includes(search.toLowerCase()) ||
      loan.loan_id.toLowerCase().includes(search.toLowerCase());

    const dueDate = new Date(loan.due_date);
    const isOverdue = !loan.return_date && dueDate < today;
    const isActive = !loan.return_date;
    const isReturned = !!loan.return_date;

    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'active' && isActive && !isOverdue) ||
      (statusFilter === 'overdue' && isOverdue) ||
      (statusFilter === 'returned' && isReturned);

    return matchesSearch && matchesStatus;
  }).sort((a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime());

  const statusOptions = [
    { value: 'all', label: 'Все выдачи' },
    { value: 'active', label: 'Активные' },
    { value: 'overdue', label: 'Просроченные' },
    { value: 'returned', label: 'Возвращённые' },
  ];

  const availableBooks = books.filter(b => b.isAvailable);
  const bookOptions = [
    { value: '', label: 'Выберите книгу' },
    ...availableBooks.map(b => ({ value: b.book_code, label: `${b.title} (${b.book_code})` }))
  ];

  const readerOptions = [
    { value: '', label: 'Выберите читателя' },
    ...readers.map(r => ({ value: r.reader_id, label: `${r.fio} (${r.group})` }))
  ];

  const handleCreateLoan = () => {
    if (newLoanData.readerId && newLoanData.bookCode && newLoanData.dueDate) {
      const book = getBookByCode(newLoanData.bookCode);
      const reader = getReaderById(newLoanData.readerId);
      issueLoan(newLoanData.readerId, newLoanData.bookCode, newLoanData.dueDate);
      toast.success(
        '📘 Книга успешно выдана!',
        `«${book?.title}» выдана читателю ${reader?.fio}`
      );
      setNewLoanData({ readerId: '', bookCode: '', dueDate: '' });
      setShowNewLoan(false);
      setConfirmNewLoan(false);
    }
  };

  const handleReturnLoan = (loanId: string) => {
    const loan = loans.find(l => l.loan_id === loanId);
    const book = loan ? getBookByCode(loan.book_code) : null;
    const reader = loan ? getReaderById(loan.reader_id) : null;
    const dueDate = loan ? new Date(loan.due_date) : null;
    const wasOverdue = dueDate ? dueDate < today : false;
    
    returnLoan(loanId);
    
    if (wasOverdue) {
      toast.warning(
        '📗 Книга возвращена с просрочкой',
        `«${book?.title}» возвращена читателем ${reader?.fio}`
      );
    } else {
      toast.success(
        '📗 Книга успешно возвращена!',
        `«${book?.title}» возвращена читателем ${reader?.fio}`
      );
    }
    setConfirmReturn(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Выдачи книг</h1>
          <p className="text-slate-400">Учёт выдач и возвратов</p>
        </div>
        <Button onClick={() => setShowNewLoan(true)}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Новая выдача
        </Button>
      </div>

      {/* New loan form */}
      {showNewLoan && (
        <Card className="mb-6 border-indigo-500/30">
          <h3 className="text-lg font-semibold text-white mb-4">Новая выдача</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Dropdown
              options={readerOptions}
              value={newLoanData.readerId}
              onChange={(v) => setNewLoanData(prev => ({ ...prev, readerId: v }))}
              placeholder="Выберите читателя"
              searchable
            />
            <Dropdown
              options={bookOptions}
              value={newLoanData.bookCode}
              onChange={(v) => setNewLoanData(prev => ({ ...prev, bookCode: v }))}
              placeholder="Выберите книгу"
              searchable
            />
            <Input
              type="date"
              value={newLoanData.dueDate}
              onChange={(e) => setNewLoanData(prev => ({ ...prev, dueDate: e.target.value }))}
              min={todayStr}
            />
            <div className="flex gap-2">
              <Button
                variant="success"
                onClick={() => setConfirmNewLoan(true)}
                disabled={!newLoanData.readerId || !newLoanData.bookCode || !newLoanData.dueDate}
              >
                Выдать
              </Button>
              <Button variant="ghost" onClick={() => setShowNewLoan(false)}>
                Отмена
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Поиск по книге, читателю, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
          <Dropdown
            options={statusOptions}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Статус"
          />
          <div className="flex items-center gap-2 text-slate-400">
            <span>Показано:</span>
            <span className="text-white font-semibold">{filteredLoans.length}</span>
            <span>из</span>
            <span className="text-white">{loans.length}</span>
          </div>
        </div>
      </Card>

      {/* Loans table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/30">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Книга</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Читатель</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Выдана</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Срок</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Статус</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredLoans.map(loan => {
                const book = getBookByCode(loan.book_code);
                const reader = getReaderById(loan.reader_id);
                const dueDate = new Date(loan.due_date);
                const isOverdue = !loan.return_date && dueDate < today;
                const daysOverdue = isOverdue ? Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

                return (
                  <tr key={loan.loan_id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-white font-medium">{book?.title}</p>
                        <p className="text-xs text-slate-500">{loan.book_code}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-white">{reader?.fio}</p>
                        <p className="text-xs text-slate-500">{reader?.group}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-300">{loan.issue_date}</td>
                    <td className="px-4 py-4 text-slate-300">{loan.due_date}</td>
                    <td className="px-4 py-4">
                      {loan.return_date ? (
                        <Badge variant="default">Возвращена {loan.return_date}</Badge>
                      ) : isOverdue ? (
                        <Badge variant="danger" pulse>Просрочка {daysOverdue} дн.</Badge>
                      ) : (
                        <Badge variant="success">Активна</Badge>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {!loan.return_date && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setConfirmReturn(loan.loan_id)}
                        >
                          Вернуть
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {filteredLoans.length === 0 && (
        <div className="text-center py-12">
          <span className="text-4xl">📖</span>
          <p className="text-slate-400 mt-4">Выдачи не найдены</p>
        </div>
      )}

      {/* Confirm return dialog */}
      <ConfirmDialog
        isOpen={!!confirmReturn}
        onClose={() => setConfirmReturn(null)}
        onConfirm={() => {
          if (confirmReturn) {
            handleReturnLoan(confirmReturn);
          }
        }}
        title="Подтвердить возврат"
        message="Вы уверены, что хотите зарегистрировать возврат этой книги?"
        confirmText="Вернуть книгу"
        variant="info"
      />

      {/* Confirm new loan dialog */}
      <ConfirmDialog
        isOpen={confirmNewLoan}
        onClose={() => setConfirmNewLoan(false)}
        onConfirm={handleCreateLoan}
        title="Подтвердить выдачу"
        message={`Выдать книгу «${getBookByCode(newLoanData.bookCode)?.title}» читателю ${getReaderById(newLoanData.readerId)?.fio}? Срок возврата: ${newLoanData.dueDate}`}
        confirmText="Выдать"
        variant="info"
      />
    </div>
  );
}
