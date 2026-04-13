// Синтетические данные для библиотечной системы
import { Book, Reader, Loan, User, Reservation } from '../types';

// Демо-пользователи
export const users: User[] = [
  { id: 'USR001', username: 'admin', password: 'admin123', role: 'admin', fullName: 'Администратор Системы' },
  { id: 'USR002', username: 'librarian', password: 'lib123', role: 'librarian', fullName: 'Библиотекарь Главный' },
  { id: 'USR003', username: 'reader', password: 'reader123', role: 'reader', fullName: 'Иванов Александр Александрович', readerId: 'RD0001' },
];

// 50 книг
const authors = [
  'Пушкин А.С.', 'Толстой Л.Н.', 'Достоевский Ф.М.', 'Чехов А.П.',
  'Гоголь Н.В.', 'Тургенев И.С.', 'Булгаков М.А.', 'Горький М.',
  'Есенин С.А.', 'Маяковский В.В.', 'Ахматова А.А.', 'Цветаева М.И.'
];

const titles = [
  'Евгений Онегин', 'Война и мир', 'Преступление и наказание', 'Вишнёвый сад',
  'Мёртвые души', 'Отцы и дети', 'Мастер и Маргарита', 'На дне',
  'Стихотворения', 'Облако в штанах', 'Реквием', 'Поэма горы',
  'Двенадцать', 'Тёмные аллеи', 'Гранатовый браслет', 'Тихий Дон',
  'Доктор Живаго', 'Архипелаг ГУЛАГ', 'Лолита', 'Мы'
];

const descriptions = [
  'Классическое произведение русской литературы, входящее в школьную программу.',
  'Роман-эпопея, описывающий жизнь русского общества в эпоху войн.',
  'Философский роман о морали, совести и искуплении.',
  'Пьеса о судьбе русской интеллигенции на рубеже веков.',
  'Сатирическая поэма о российской действительности.',
];

export const books: Book[] = Array.from({ length: 50 }, (_, i) => ({
  book_code: `BK${String(i + 1).padStart(4, '0')}`,
  title: titles[i % titles.length] + (i >= titles.length ? ` (том ${Math.floor(i / titles.length) + 1})` : ''),
  author: authors[i % authors.length],
  year: 1850 + (i * 3) % 150,
  udk: `84(2Рус)${i % 3 === 0 ? '-1' : ''}`,
  description: descriptions[i % descriptions.length],
  publisher: 'Издательство «Просвещение»',
  pages: 100 + i * 15,
  isbn: `978-5-${String(i).padStart(4, '0')}-${String(i * 2).padStart(4, '0')}-${i % 10}`,
  isAvailable: i > 30,
}));

// 30 читателей
const groups = ['ИС-21', 'ИС-22', 'ИС-23', 'ПИ-21', 'ПИ-22', 'ПИ-23', 'ММ-21', 'ММ-22', 'ФИЗ-21', 'ФИЗ-22', 'ХИМ-21', 'ЭК-21'];
const firstNames = ['Александр', 'Мария', 'Дмитрий', 'Анна', 'Сергей', 'Елена', 'Андрей', 'Ольга', 'Михаил', 'Наталья'];
const lastNames = ['Иванов', 'Петров', 'Сидоров', 'Козлов', 'Новиков', 'Морозов', 'Волков', 'Соколов', 'Лебедев', 'Кузнецов'];
const patronymics = ['Александрович', 'Дмитриевич', 'Сергеевич', 'Михайлович', 'Андреевич', 'Александровна', 'Дмитриевна', 'Сергеевна', 'Михайловна', 'Андреевна'];

export const readers: Reader[] = Array.from({ length: 30 }, (_, i) => ({
  reader_id: `RD${String(i + 1).padStart(4, '0')}`,
  fio: `${lastNames[i % lastNames.length]} ${firstNames[i % firstNames.length]} ${patronymics[i % patronymics.length]}`,
  group: groups[i % groups.length],
  email: `reader${i + 1}@library.ru`,
  phone: `+7-900-${String(i + 1).padStart(3, '0')}-00-00`,
}));

// Функция для генерации дат
const today = new Date();
const formatDate = (d: Date): string => d.toISOString().split('T')[0];
const addDays = (d: Date, days: number): Date => new Date(d.getTime() + days * 24 * 60 * 60 * 1000);

// 120+ выдач
export const loans: Loan[] = [];

// Активные выдачи без просрочки (30)
for (let i = 0; i < 30; i++) {
  loans.push({
    loan_id: `LN${String(i + 1).padStart(5, '0')}`,
    reader_id: `RD${String((i % 30) + 1).padStart(4, '0')}`,
    book_code: `BK${String((i % 30) + 1).padStart(4, '0')}`,
    issue_date: formatDate(addDays(today, -7)),
    due_date: formatDate(addDays(today, 7 + (i % 14))),
    created_by: 'USR002',
  });
}

// Активные просроченные выдачи (20)
for (let i = 30; i < 50; i++) {
  loans.push({
    loan_id: `LN${String(i + 1).padStart(5, '0')}`,
    reader_id: `RD${String((i % 30) + 1).padStart(4, '0')}`,
    book_code: `BK${String(i + 1).padStart(4, '0')}`,
    issue_date: formatDate(addDays(today, -30)),
    due_date: formatDate(addDays(today, -(1 + (i % 14)))),
    created_by: 'USR002',
  });
}

// Возвращённые вовремя (30)
for (let i = 50; i < 80; i++) {
  const issueDate = addDays(today, -60 - i);
  const dueDate = addDays(issueDate, 14);
  loans.push({
    loan_id: `LN${String(i + 1).padStart(5, '0')}`,
    reader_id: `RD${String((i % 30) + 1).padStart(4, '0')}`,
    book_code: `BK${String((i % 50) + 1).padStart(4, '0')}`,
    issue_date: formatDate(issueDate),
    due_date: formatDate(dueDate),
    return_date: formatDate(addDays(dueDate, -3)),
    created_by: 'USR002',
    returned_by: 'USR002',
  });
}

// Возвращённые с просрочкой (40)
for (let i = 80; i < 120; i++) {
  const issueDate = addDays(today, -90 - i);
  const dueDate = addDays(issueDate, 14);
  loans.push({
    loan_id: `LN${String(i + 1).padStart(5, '0')}`,
    reader_id: `RD${String((i % 30) + 1).padStart(4, '0')}`,
    book_code: `BK${String((i % 50) + 1).padStart(4, '0')}`,
    issue_date: formatDate(issueDate),
    due_date: formatDate(dueDate),
    return_date: formatDate(addDays(dueDate, 5 + (i % 10))),
    created_by: 'USR002',
    returned_by: 'USR002',
  });
}

// Специальные выдачи для демо-читателя с уведомлениями
loans.push(
  {
    loan_id: 'LN00121',
    reader_id: 'RD0001',
    book_code: 'BK0045',
    issue_date: formatDate(addDays(today, -7)),
    due_date: formatDate(addDays(today, 7)),
    created_by: 'USR002',
  },
  {
    loan_id: 'LN00122',
    reader_id: 'RD0001',
    book_code: 'BK0046',
    issue_date: formatDate(addDays(today, -11)),
    due_date: formatDate(addDays(today, 3)),
    created_by: 'USR002',
  },
  {
    loan_id: 'LN00123',
    reader_id: 'RD0001',
    book_code: 'BK0047',
    issue_date: formatDate(addDays(today, -13)),
    due_date: formatDate(addDays(today, 1)),
    created_by: 'USR002',
  },
  {
    loan_id: 'LN00124',
    reader_id: 'RD0001',
    book_code: 'BK0048',
    issue_date: formatDate(addDays(today, -20)),
    due_date: formatDate(addDays(today, -5)),
    created_by: 'USR002',
  }
);

// Бронирования
export const reservations: Reservation[] = [];
