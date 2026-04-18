import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Dropdown } from '../components/ui/Dropdown';
import { Modal, ConfirmDialog } from '../components/ui/Modal';
import { Book } from '../types';

export function CatalogPage() {
  const { books, hasRole, canReserveBook, createReservation, currentUser, addBook, updateBook, deleteBook } = useApp();
  const [search, setSearch] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [udkFilter, setUdkFilter] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [confirmReserve, setConfirmReserve] = useState<Book | null>(null);
  const [reservationResult, setReservationResult] = useState<{ success: boolean; message: string } | null>(null);

  // === ADD/EDIT BOOK STATE ===
  const [addBookOpen, setAddBookOpen] = useState(false);
  const [editBookCode, setEditBookCode] = useState<string | null>(null);
  const [newBook, setNewBook] = useState({
    book_code: '', title: '', author: '', year: '2024', udk: '',
    description: '', publisher: '', pages: '', isbn: ''
  });

  const authors = [...new Set(books.map(b => b.author))].sort();
  const udks = [...new Set(books.map(b => b.udk))].sort();

  const filteredBooks = books.filter(book => {
    const matchesSearch = !search ||
      book.title.toLowerCase().includes(search.toLowerCase()) ||
      book.author.toLowerCase().includes(search.toLowerCase()) ||
      book.book_code.toLowerCase().includes(search.toLowerCase());
    const matchesAuthor = !authorFilter || book.author === authorFilter;
    const matchesUdk = !udkFilter || book.udk === udkFilter;
    const matchesAvailable = !availableOnly || book.isAvailable;
    return matchesSearch && matchesAuthor && matchesUdk && matchesAvailable;
  });

  const handleReserve = (book: Book) => {
    const result = createReservation(book.book_code);
    setReservationResult(result);
    setConfirmReserve(null);
  };

  const handleOpenAddBook = () => {
    const nextCode = `BK${String(books.length + 1).padStart(4, '0')}`;
    setNewBook({
      book_code: nextCode, title: '', author: '', year: '2024', udk: '',
      description: '', publisher: '', pages: '', isbn: ''
    });
    setEditBookCode(null);
    setAddBookOpen(true);
  };

  const handleSaveBook = () => {
    if (!newBook.book_code.trim() || !newBook.title.trim() || !newBook.author.trim() || !newBook.udk.trim()) return;
    if (editBookCode) {
      updateBook(editBookCode, {
        title: newBook.title.trim(),
        author: newBook.author.trim(),
        year: parseInt(newBook.year) || 2024,
        udk: newBook.udk.trim(),
        description: newBook.description || undefined,
        publisher: newBook.publisher || undefined,
        pages: newBook.pages ? parseInt(newBook.pages) : undefined,
        isbn: newBook.isbn || undefined,
      });
    } else {
      addBook({
        book_code: newBook.book_code.trim(),
        title: newBook.title.trim(),
        author: newBook.author.trim(),
        year: parseInt(newBook.year) || 2024,
        udk: newBook.udk.trim(),
        description: newBook.description || undefined,
        publisher: newBook.publisher || undefined,
        pages: newBook.pages ? parseInt(newBook.pages) : undefined,
        isbn: newBook.isbn || undefined,
        isAvailable: true,
      });
    }
    setAddBookOpen(false);
    setEditBookCode(null);
  };

  const authorOptions = [
    { value: '', label: 'Все авторы' },
    ...authors.map(a => ({ value: a, label: a }))
  ];

  const udkOptions = [
    { value: '', label: 'Все УДК' },
    ...udks.map(u => ({ value: u, label: u }))
  ];

  const canAdd = newBook.book_code.trim() && newBook.title.trim() && newBook.author.trim() && newBook.udk.trim();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Каталог книг</h1>
          <p className="text-slate-400">Всего {books.length} книг, {filteredBooks.length} показано</p>
        </div>
        {hasRole('admin', 'librarian') && (
          <button
            type="button"
            onClick={handleOpenAddBook}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/25 transition-all duration-300 active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Добавить книгу
          </button>
        )}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Поиск по названию, автору, коду..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
          <Dropdown
            options={authorOptions}
            value={authorFilter}
            onChange={setAuthorFilter}
            placeholder="Все авторы"
            searchable
          />
          <Dropdown
            options={udkOptions}
            value={udkFilter}
            onChange={setUdkFilter}
            placeholder="Все УДК"
          />
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
              className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
            />
            <span className="text-slate-300">Только доступные</span>
          </label>
        </div>
      </Card>

      {/* Books grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBooks.map((book) => {
          const reserveCheck = currentUser?.role === 'reader' ? canReserveBook(book.book_code) : null;

          return (
            <Card
              key={book.book_code}
              hover
              onClick={() => setSelectedBook(book)}
              className="cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-20 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg flex items-center justify-center text-3xl shrink-0">
                  📕
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">{book.title}</h3>
                  <p className="text-sm text-slate-400">{book.author}</p>
                  <p className="text-xs text-slate-500 mt-1">{book.year} · {book.udk}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant={book.isAvailable ? 'success' : 'warning'} size="sm">
                      {book.isAvailable ? 'Доступна' : 'Выдана'}
                    </Badge>
                    <span className="text-xs text-slate-500">{book.book_code}</span>
                  </div>
                </div>
              </div>

              {currentUser?.role === 'reader' && book.isAvailable && (
                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <Button
                    variant={reserveCheck?.canReserve ? 'secondary' : 'ghost'}
                    size="sm"
                    className="w-full"
                    disabled={!reserveCheck?.canReserve}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (reserveCheck?.canReserve) setConfirmReserve(book);
                    }}
                  >
                    {reserveCheck?.canReserve ? '🔖 Забронировать' : reserveCheck?.reason}
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {filteredBooks.length === 0 && (
        <div className="text-center py-12">
          <span className="text-4xl">📚</span>
          <p className="text-slate-400 mt-4">Книги не найдены</p>
          <p className="text-slate-500 text-sm">Попробуйте изменить параметры поиска</p>
        </div>
      )}

      {/* Book detail modal */}
      <Modal isOpen={!!selectedBook} onClose={() => setSelectedBook(null)} title={selectedBook?.title} size="lg">
        {selectedBook && (
          <div className="space-y-6">
            <div className="flex items-start gap-6">
              <div className="w-32 h-48 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl flex items-center justify-center text-6xl shrink-0">📕</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">{selectedBook.title}</h2>
                <p className="text-lg text-slate-300">{selectedBook.author}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge variant={selectedBook.isAvailable ? 'success' : 'warning'}>{selectedBook.isAvailable ? 'Доступна' : 'Выдана'}</Badge>
                  <Badge variant="info">{selectedBook.year}</Badge>
                  <Badge variant="default">УДК: {selectedBook.udk}</Badge>
                </div>
              </div>
            </div>
            {selectedBook.description && (
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-2">Описание</h3>
                <p className="text-slate-300">{selectedBook.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-700/30 rounded-xl">
                <p className="text-xs text-slate-400">Код книги</p>
                <p className="text-white font-mono">{selectedBook.book_code}</p>
              </div>
              <div className="p-4 bg-slate-700/30 rounded-xl">
                <p className="text-xs text-slate-400">Издательство</p>
                <p className="text-white">{selectedBook.publisher || '—'}</p>
              </div>
              <div className="p-4 bg-slate-700/30 rounded-xl">
                <p className="text-xs text-slate-400">Страниц</p>
                <p className="text-white">{selectedBook.pages || '—'}</p>
              </div>
              <div className="p-4 bg-slate-700/30 rounded-xl">
                <p className="text-xs text-slate-400">ISBN</p>
                <p className="text-white font-mono text-sm">{selectedBook.isbn || '—'}</p>
              </div>
            </div>
            {hasRole('admin', 'librarian') && (
              <div className="flex gap-3 pt-4 border-t border-slate-700/50">
                <button type="button" onClick={() => {
                  setNewBook({
                    book_code: selectedBook.book_code,
                    title: selectedBook.title,
                    author: selectedBook.author,
                    year: String(selectedBook.year),
                    udk: selectedBook.udk,
                    description: selectedBook.description || '',
                    publisher: selectedBook.publisher || '',
                    pages: selectedBook.pages ? String(selectedBook.pages) : '',
                    isbn: selectedBook.isbn || '',
                  });
                  setEditBookCode(selectedBook.book_code);
                  setSelectedBook(null);
                  setAddBookOpen(true);
                }} className="flex-1 px-4 py-2 text-sm font-medium rounded-xl bg-slate-700/50 text-slate-200 hover:bg-slate-600/50 transition-all">
                  Редактировать
                </button>
                <button type="button" onClick={() => {
                  deleteBook(selectedBook.book_code);
                  setSelectedBook(null);
                }} className="px-4 py-2 text-sm font-medium rounded-xl text-red-400 hover:bg-red-500/20 transition-all">
                  Удалить
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Confirm reservation */}
      <ConfirmDialog
        isOpen={!!confirmReserve}
        onClose={() => setConfirmReserve(null)}
        onConfirm={() => confirmReserve && handleReserve(confirmReserve)}
        title="Подтвердить бронирование"
        message={`Вы хотите забронировать книгу «${confirmReserve?.title}»? Бронь действует 24 часа.`}
        confirmText="Забронировать"
        variant="info"
      />

      {/* Reservation result */}
      <Modal isOpen={!!reservationResult} onClose={() => setReservationResult(null)} size="sm">
        <div className="text-center py-4">
          <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${reservationResult?.success ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
            <span className="text-4xl">{reservationResult?.success ? '✓' : '✗'}</span>
          </div>
          <h3 className="text-lg font-semibold text-white mt-4">{reservationResult?.success ? 'Успешно!' : 'Ошибка'}</h3>
          <p className="text-slate-400 mt-2">{reservationResult?.message}</p>
          <Button className="mt-6" onClick={() => setReservationResult(null)}>Закрыть</Button>
        </div>
      </Modal>

      {/* === ADD/EDIT BOOK MODAL === */}
      <Modal isOpen={addBookOpen} onClose={() => { setAddBookOpen(false); setEditBookCode(null); }} title={editBookCode ? 'Редактировать книгу' : 'Добавить книгу'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Код книги" value={newBook.book_code} onChange={(e) => setNewBook(p => ({ ...p, book_code: e.target.value }))} placeholder="BK0001" disabled={!!editBookCode} />
            <Input label="Год издания" value={newBook.year} onChange={(e) => setNewBook(p => ({ ...p, year: e.target.value }))} placeholder="2024" />
          </div>
          <Input label="Название *" value={newBook.title} onChange={(e) => setNewBook(p => ({ ...p, title: e.target.value }))} placeholder="Название книги" />
          <Input label="Автор *" value={newBook.author} onChange={(e) => setNewBook(p => ({ ...p, author: e.target.value }))} placeholder="Фамилия И.О." />
          <div className="grid grid-cols-2 gap-4">
            <Input label="УДК *" value={newBook.udk} onChange={(e) => setNewBook(p => ({ ...p, udk: e.target.value }))} placeholder="84(2Рус)" />
            <Input label="ISBN" value={newBook.isbn} onChange={(e) => setNewBook(p => ({ ...p, isbn: e.target.value }))} placeholder="978-5-0000-0000-0" />
          </div>
          <Input label="Издательство" value={newBook.publisher} onChange={(e) => setNewBook(p => ({ ...p, publisher: e.target.value }))} placeholder="Издательство" />
          <Input label="Описание" value={newBook.description} onChange={(e) => setNewBook(p => ({ ...p, description: e.target.value }))} placeholder="Краткое описание книги" />
          <div className="flex gap-3 pt-4 border-t border-slate-700/50">
            <button
              type="button"
              disabled={!canAdd}
              onClick={handleSaveBook}
              className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editBookCode ? 'Сохранить изменения' : 'Добавить книгу'}
            </button>
            <button
              type="button"
              onClick={() => { setAddBookOpen(false); setEditBookCode(null); }}
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
