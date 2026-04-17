// Синтетические данные АБИС — соответствуют T1 (250 книг, 150 читателей, 600 выдач)
import { Book, Reader, Loan, User, Reservation } from '../types';

export const users: User[] = [
  { id: 'USR001', username: 'admin', password: 'admin123', role: 'admin', fullName: 'Администратор Системы' },
  { id: 'USR002', username: 'librarian', password: 'lib123', role: 'librarian', fullName: 'Библиотекарь Главный' },
  { id: 'USR003', username: 'reader', password: 'reader123', role: 'reader', fullName: 'Иванов Александр Александрович', readerId: 'RD0001' },
];

// === 250 книг ===
const authors = [
  'Пушкин А.С.', 'Толстой Л.Н.', 'Достоевский Ф.М.', 'Чехов А.П.',
  'Гоголь Н.В.', 'Тургенев И.С.', 'Булгаков М.А.', 'Горький М.',
  'Есенин С.А.', 'Маяковский В.В.', 'Ахматова А.А.', 'Цветаева М.И.',
  'Блок А.А.', 'Бунин И.А.', 'Куприн А.И.', 'Шолохов М.А.',
  'Пастернак Б.Л.', 'Солженицын А.И.', 'Набоков В.В.', 'Замятин Е.И.',
  'Платонов А.П.', 'Зощенко М.М.', 'Лермонтов М.Ю.', 'Некрасов Н.А.', 'Грибоедов А.С.',
];
const titles = [
  'Евгений Онегин', 'Война и мир', 'Преступление и наказание', 'Вишнёвый сад',
  'Мёртвые души', 'Отцы и дети', 'Мастер и Маргарита', 'На дне',
  'Стихотворения', 'Облако в штанах', 'Реквием', 'Поэма горы',
  'Двенадцать', 'Тёмные аллеи', 'Гранатовый браслет', 'Тихий Дон',
  'Доктор Живаго', 'Архипелаг ГУЛАГ', 'Защита Лужина', 'Мы',
  'Котлован', 'Аристократка', 'Герой нашего времени', 'Кому на Руси жить хорошо', 'Горе от ума',
  'Анна Каренина', 'Идиот', 'Бесы', 'Братья Карамазовы', 'Обломов',
  'Собачье сердце', 'Белая гвардия', 'Ревизор', 'Капитанская дочка', 'Руслан и Людмила',
  'Пиковая дама', 'Дубровский', 'Палата №6', 'Три сестры', 'Дядя Ваня',
  'Чайка', 'Записки из подполья', 'Бедные люди', 'Воскресение', 'Дворянское гнездо',
  'Накануне', 'Рудин', 'Вешние воды', 'Ася', 'Первая любовь',
];
const udks = ['84(2Рус)', '84(2Рус)-1', '84(2Рус)-4', '82.09', '821.161.1'];

export const books: Book[] = Array.from({ length: 250 }, (_, i) => ({
  book_code: `BK${String(i + 1).padStart(4, '0')}`,
  title: titles[i % titles.length] + (i >= titles.length ? ` (экз. ${Math.floor(i / titles.length) + 1})` : ''),
  author: authors[i % authors.length],
  year: 1820 + ((i * 7) % 200),
  udk: udks[i % udks.length],
  description: `Произведение автора ${authors[i % authors.length]}. Классика русской литературы.`,
  publisher: i % 3 === 0 ? 'Издательство «Просвещение»' : i % 3 === 1 ? 'Издательство «Эксмо»' : 'Издательство «АСТ»',
  pages: 80 + ((i * 13) % 500),
  isbn: `978-5-${String(i).padStart(4, '0')}-${String((i * 3) % 10000).padStart(4, '0')}-${i % 10}`,
  isAvailable: i >= 140, // first 140 books are "checked out"
}));

// === 150 читателей ===
const groups = ['ИС-21', 'ИС-22', 'ИС-23', 'ИС-24', 'ПИ-21', 'ПИ-22', 'ПИ-23', 'ММ-21', 'ММ-22', 'ФИЗ-21', 'ФИЗ-22', 'ХИМ-21', 'ХИМ-22', 'ЭК-21', 'ЭК-22'];
const firstM = ['Александр', 'Дмитрий', 'Сергей', 'Андрей', 'Михаил', 'Иван', 'Артём', 'Максим', 'Никита', 'Кирилл', 'Егор', 'Даниил', 'Роман', 'Владимир', 'Олег'];
const firstF = ['Мария', 'Анна', 'Елена', 'Ольга', 'Наталья', 'Екатерина', 'Татьяна', 'Ирина', 'Юлия', 'Дарья', 'Алина', 'Виктория', 'Полина', 'София', 'Ксения'];
const lastN = ['Иванов', 'Петров', 'Сидоров', 'Козлов', 'Новиков', 'Морозов', 'Волков', 'Соколов', 'Лебедев', 'Кузнецов', 'Попов', 'Смирнов', 'Васильев', 'Павлов', 'Фёдоров', 'Николаев', 'Алексеев', 'Степанов', 'Зайцев', 'Орлов'];
const patM = ['Александрович', 'Дмитриевич', 'Сергеевич', 'Михайлович', 'Андреевич', 'Иванович', 'Олегович'];
const patF = ['Александровна', 'Дмитриевна', 'Сергеевна', 'Михайловна', 'Андреевна', 'Ивановна', 'Олеговна'];

export const readers: Reader[] = Array.from({ length: 150 }, (_, i) => {
  const isMale = i % 2 === 0;
  const fn = isMale ? firstM[i % firstM.length] : firstF[i % firstF.length];
  const ln = lastN[i % lastN.length] + (isMale ? '' : 'а');
  const pt = isMale ? patM[i % patM.length] : patF[i % patF.length];
  return {
    reader_id: `RD${String(i + 1).padStart(4, '0')}`,
    fio: `${ln} ${fn} ${pt}`,
    group: groups[i % groups.length],
    email: `reader${i + 1}@library.ru`,
    phone: `+7-900-${String(i + 1).padStart(3, '0')}-00-00`,
  };
});

// === 600 выдач ===
const today = new Date();
const fmt = (d: Date): string => d.toISOString().split('T')[0];
const add = (d: Date, days: number): Date => new Date(d.getTime() + days * 86400000);

// Simple seeded random for reproducibility
let seed = 42;
function rnd(max: number): number {
  seed = (seed * 16807 + 0) % 2147483647;
  return seed % max;
}

export const loans: Loan[] = [];

// Active loans without overdue (80)
for (let i = 0; i < 80; i++) {
  loans.push({
    loan_id: `LN${String(i + 1).padStart(5, '0')}`,
    reader_id: `RD${String(rnd(150) + 1).padStart(4, '0')}`,
    book_code: `BK${String(i + 1).padStart(4, '0')}`,
    issue_date: fmt(add(today, -(3 + rnd(18)))),
    due_date: fmt(add(today, 1 + rnd(20))),
    created_by: 'USR002',
  });
}

// Active overdue loans (60)
for (let i = 80; i < 140; i++) {
  loans.push({
    loan_id: `LN${String(i + 1).padStart(5, '0')}`,
    reader_id: `RD${String(rnd(150) + 1).padStart(4, '0')}`,
    book_code: `BK${String(i + 1).padStart(4, '0')}`,
    issue_date: fmt(add(today, -(20 + rnd(40)))),
    due_date: fmt(add(today, -(1 + rnd(25)))),
    created_by: 'USR002',
  });
}

// Returned on time (260)
for (let i = 140; i < 400; i++) {
  const issueDate = add(today, -(30 + rnd(150)));
  const dueDate = add(issueDate, 7 + rnd(14));
  const returnDate = add(issueDate, 3 + rnd(Math.max(1, Math.floor((dueDate.getTime() - issueDate.getTime()) / 86400000))));
  loans.push({
    loan_id: `LN${String(i + 1).padStart(5, '0')}`,
    reader_id: `RD${String(rnd(150) + 1).padStart(4, '0')}`,
    book_code: `BK${String(rnd(250) + 1).padStart(4, '0')}`,
    issue_date: fmt(issueDate),
    due_date: fmt(dueDate),
    return_date: fmt(returnDate),
    created_by: 'USR002',
    returned_by: 'USR002',
  });
}

// Returned late (200)
for (let i = 400; i < 600; i++) {
  const issueDate = add(today, -(40 + rnd(160)));
  const dueDate = add(issueDate, 7 + rnd(14));
  const returnDate = add(dueDate, 1 + rnd(30));
  loans.push({
    loan_id: `LN${String(i + 1).padStart(5, '0')}`,
    reader_id: `RD${String(rnd(150) + 1).padStart(4, '0')}`,
    book_code: `BK${String(rnd(250) + 1).padStart(4, '0')}`,
    issue_date: fmt(issueDate),
    due_date: fmt(dueDate),
    return_date: fmt(returnDate),
    created_by: 'USR002',
    returned_by: 'USR002',
  });
}

// Demo reader loans for notifications
loans.push(
  { loan_id: 'LN00601', reader_id: 'RD0001', book_code: 'BK0200', issue_date: fmt(add(today, -7)), due_date: fmt(add(today, 7)), created_by: 'USR002' },
  { loan_id: 'LN00602', reader_id: 'RD0001', book_code: 'BK0201', issue_date: fmt(add(today, -11)), due_date: fmt(add(today, 3)), created_by: 'USR002' },
  { loan_id: 'LN00603', reader_id: 'RD0001', book_code: 'BK0202', issue_date: fmt(add(today, -13)), due_date: fmt(add(today, 1)), created_by: 'USR002' },
  { loan_id: 'LN00604', reader_id: 'RD0001', book_code: 'BK0203', issue_date: fmt(add(today, -20)), due_date: fmt(add(today, -5)), created_by: 'USR002' },
);

export const reservations: Reservation[] = [];
