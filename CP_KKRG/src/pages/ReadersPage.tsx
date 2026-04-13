import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Dropdown } from '../components/ui/Dropdown';
import { Modal } from '../components/ui/Modal';

export function ReadersPage() {
  const { readers, loans, hasRole, addReader, updateReader } = useApp();
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('');

  // === ADD/EDIT READER STATE ===
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ reader_id: '', fio: '', group: '', email: '', phone: '' });

  const groups = [...new Set(readers.map(r => r.group))].sort();

  const groupOptions = [
    { value: '', label: 'Все группы' },
    ...groups.map(g => ({ value: g, label: g }))
  ];

  const filteredReaders = readers.filter(reader => {
    const matchesSearch = !search ||
      reader.fio.toLowerCase().includes(search.toLowerCase()) ||
      reader.reader_id.toLowerCase().includes(search.toLowerCase());
    const matchesGroup = !groupFilter || reader.group === groupFilter;
    return matchesSearch && matchesGroup;
  });

  const getReaderStats = (readerId: string) => {
    const readerLoans = loans.filter(l => l.reader_id === readerId);
    const activeLoans = readerLoans.filter(l => !l.return_date);
    const today = new Date();
    const overdueLoans = activeLoans.filter(l => new Date(l.due_date) < today);
    return { total: readerLoans.length, active: activeLoans.length, overdue: overdueLoans.length };
  };

  const handleOpenAdd = () => {
    const nextId = `RD${String(readers.length + 1).padStart(4, '0')}`;
    setForm({ reader_id: nextId, fio: '', group: '', email: '', phone: '' });
    setEditingId(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (readerId: string) => {
    const reader = readers.find(r => r.reader_id === readerId);
    if (!reader) return;
    setForm({
      reader_id: reader.reader_id,
      fio: reader.fio,
      group: reader.group,
      email: reader.email || '',
      phone: reader.phone || '',
    });
    setEditingId(readerId);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.fio.trim() || !form.group.trim() || !form.reader_id.trim()) return;
    if (editingId) {
      updateReader(editingId, {
        fio: form.fio.trim(),
        group: form.group.trim(),
        email: form.email || undefined,
        phone: form.phone || undefined,
      });
    } else {
      addReader({
        reader_id: form.reader_id.trim(),
        fio: form.fio.trim(),
        group: form.group.trim(),
        email: form.email || undefined,
        phone: form.phone || undefined,
      });
    }
    setModalOpen(false);
    setEditingId(null);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  if (!hasRole('admin', 'librarian')) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-400">У вас нет доступа к этой странице</p>
      </div>
    );
  }

  const canSave = form.fio.trim() && form.group.trim() && form.reader_id.trim();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Читатели</h1>
          <p className="text-slate-400">Всего {readers.length} читателей</p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/25 transition-all duration-300 active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Добавить читателя
        </button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Поиск по ФИО или ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
          <Dropdown
            options={groupOptions}
            value={groupFilter}
            onChange={setGroupFilter}
            placeholder="Все группы"
            searchable
          />
          <div className="flex items-center gap-2 text-slate-400">
            <span>Показано:</span>
            <span className="text-white font-semibold">{filteredReaders.length}</span>
          </div>
        </div>
      </Card>

      {/* Readers list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReaders.map((reader) => {
          const stats = getReaderStats(reader.reader_id);
          return (
            <Card
              key={reader.reader_id}
              hover
              className="cursor-pointer"
              onClick={() => handleOpenEdit(reader.reader_id)}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {reader.fio.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">{reader.fio}</h3>
                  <p className="text-sm text-slate-400">{reader.group}</p>
                  <p className="text-xs text-slate-500 mt-1">{reader.reader_id}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-700/50 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold text-white">{stats.total}</p>
                  <p className="text-xs text-slate-500">Всего</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-emerald-400">{stats.active}</p>
                  <p className="text-xs text-slate-500">Активных</p>
                </div>
                <div>
                  <p className={`text-lg font-bold ${stats.overdue > 0 ? 'text-red-400' : 'text-slate-400'}`}>{stats.overdue}</p>
                  <p className="text-xs text-slate-500">Просрочек</p>
                </div>
              </div>
              {stats.overdue > 0 && (
                <div className="mt-3">
                  <Badge variant="danger" size="sm">Есть просроченные книги</Badge>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {filteredReaders.length === 0 && (
        <div className="text-center py-12">
          <span className="text-4xl">👥</span>
          <p className="text-slate-400 mt-4">Читатели не найдены</p>
        </div>
      )}

      {/* === ADD/EDIT READER MODAL === */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingId ? 'Редактировать читателя' : 'Добавить читателя'}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="ID читателя"
            value={form.reader_id}
            onChange={(e) => setForm(p => ({ ...p, reader_id: e.target.value }))}
            disabled={!!editingId}
            placeholder="RD0001"
          />
          <Input
            label="ФИО *"
            value={form.fio}
            onChange={(e) => setForm(p => ({ ...p, fio: e.target.value }))}
            placeholder="Иванов Иван Иванович"
          />
          <Input
            label="Группа *"
            value={form.group}
            onChange={(e) => setForm(p => ({ ...p, group: e.target.value }))}
            placeholder="ИС-21"
          />
          <Input
            label="Email"
            value={form.email}
            onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
            placeholder="reader@library.ru"
          />
          <Input
            label="Телефон"
            value={form.phone}
            onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))}
            placeholder="+7-900-000-00-00"
          />
          <div className="flex gap-3 pt-4 border-t border-slate-700/50">
            <button
              type="button"
              disabled={!canSave}
              onClick={handleSave}
              className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingId ? 'Сохранить изменения' : 'Добавить читателя'}
            </button>
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2.5 text-sm font-medium rounded-xl text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
            >
              Отмена
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
