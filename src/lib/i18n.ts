import type { Lang } from '../types'

// Ключем словаря служит русская строка: она же — оригинал интерфейса.
// Для 'ru' ключ возвращается как есть, поэтому новую строку достаточно обернуть в t(),
// а перевод добавить в DICT: проверка переведено ли всё живёт в test-all.mjs.
type Pair = { en: string; ce: string }

export const LANGS: { v: Lang; l: string }[] = [
  { v: 'ru', l: 'Русский' },
  { v: 'en', l: 'English' },
  { v: 'ce', l: 'Нохчийн' },
]

const DICT: Record<string, Pair> = {
  'Загружаем библиотеку…': { en: 'Loading the library…', ce: 'Библиотека чуйохуш ю…' },

  Главная: { en: 'Home', ce: 'Коьрта' },
  'Мои книги': { en: 'My books', ce: 'Сан жайнаш' },
  Заметки: { en: 'Notes', ce: 'Билгалонаш' },
  Поиск: { en: 'Search', ce: 'Лахар' },
  Настройки: { en: 'Settings', ce: 'Нисдарш' },
  Закрыть: { en: 'Close', ce: 'ДӀакъовла' },

  'Вай Библиотека': { en: 'Way Library', ce: 'Вайн библиотека' },
  'Добавить книгу': { en: 'Add book', ce: 'Жайна тӀетоха' },
  'Продолжить чтение': { en: 'Continue reading', ce: 'ДӀадеша' },
  'Начать чтение': { en: 'Start reading', ce: 'Деша доладе' },
  'Здесь появится книга': { en: 'A book will appear here', ce: 'Кхузахь жайна гучудер ду' },
  'Добавьте первую книгу, чтобы начать читать.': {
    en: 'Add your first book to start reading.',
    ce: 'Хьалхара жайна тӀетоха, деша доладалийта.',
  },
  Добавить: { en: 'Add', ce: 'ТӀетоха' },
  'Недавно добавленные': { en: 'Recently added', ce: 'Керара тӀетоьхнарш' },
  Избранное: { en: 'Favorites', ce: 'Билгалдинарш' },
  Жанры: { en: 'Genres', ce: 'Жанраш' },
  'Смотреть все': { en: 'See all', ce: 'Массо а гайта' },
  Читать: { en: 'Read', ce: 'Деша' },
  '{n} стр. осталось': { en: '{n} pages left', ce: '{n} агӀо йисина' },

  'К прочтению': { en: 'To read', ce: 'Деша билгалдина' },
  '{n} из {total}': { en: '{n} of {total}', ce: '{n}/{total}' },
  'Книга не найдена': { en: 'Book not found', ce: 'Жайна ца карийра' },
  'стр. {n} из {total}': { en: 'p. {n} of {total}', ce: 'агӀо {n}/{total}' },
  'стр. {n}': { en: 'p. {n}', ce: 'агӀо {n}' },
  Читаю: { en: 'Reading', ce: 'Доьшуш ду' },
  'Хочу прочитать': { en: 'Want to read', ce: 'Деша лаьа' },
  Прочитал: { en: 'Finished', ce: 'ДӀадешна' },
  Прочитано: { en: 'Read', ce: 'ДӀадешна' },
  'Здесь пока пусто': { en: 'Nothing here yet', ce: 'Кхузахь хӀинцале еса ю' },
  'Откройте любую книгу — она появится в «Читаю».': { en: 'Open a book and it will show up in Reading.', ce: 'Муьлхха жайна схьаделла — иза «Доьшуш ду» тӀехь гучудер ду.' },
  'Дочитанная книга сама перейдёт в «Прочитал».': { en: 'A book you finish moves to Finished on its own.', ce: 'ДӀадешна даьлча, жайна ша «ДӀадешна» тӀе дер ду.' },
  'Добавлено в «Хочу прочитать»': { en: 'Added to Want to read', ce: '«Деша лаьа» тӀетоьхна' },
  'Убрано из «Хочу прочитать»': { en: 'Removed from Want to read', ce: '«Деша лаьа» йукъара дӀаяьккхина' },
  'Книга отмечена как прочитанная': { en: 'Marked as read', ce: 'Жайна «ДӀадешна» аьлла билгалдина' },
  'Снята отметка «Прочитано»': { en: 'Read mark removed', ce: '«ДӀадешна» билгало дӀаяьккхина' },
  'Нажмите «+», чтобы добавить книгу.': { en: 'Tap “+” to add a book.', ce: 'Жайна тӀетоха «+» тӀетаӀае.' },

  'Мои заметки': { en: 'My notes', ce: 'Сан билгалонаш' },
  'Заметок пока нет': { en: 'No notes yet', ce: 'Билгалонаш яц' },
  'Откройте книгу, зажмите пальцем слово в тексте и протяните на нужную фразу — цитаты соберутся здесь по книгам.': {
    en: 'Open a book, hold a word in the text and drag over the phrase you need — quotes will collect here, grouped by book.',
    ce: 'Жайна схьаделла, дош пӀелгца лаьцна дӀаоза — цитаташ кхузахь жайнашца гулйийр ю.',
  },
  последняя: { en: 'last', ce: 'тӀаьххьарниг' },
  'Книга не найдена.': { en: 'Book not found.', ce: 'Жайна ца карийра.' },
  'Заметок в этой книге больше нет.': { en: 'This book has no more notes.', ce: 'ХӀокху жайни чохь кхин билгалонаш яц.' },
  'Удалить заметку': { en: 'Delete note', ce: 'Билгало дӀайаккха' },
  Комментарий: { en: 'Comment', ce: 'Комментари' },
  Комментировать: { en: 'Comment', ce: 'Комментари йита' },
  'Изменить комментарий': { en: 'Edit comment', ce: 'Комментари хийца' },
  'Комментарий к заметке': { en: 'Note comment', ce: 'Билгалонан комментари' },
  'Напишите свои мысли или комментарий…': { en: 'Write your thoughts or comment…', ce: 'Хьайн ойланаш я комментари язъе…' },
  'Удалить комментарий': { en: 'Delete comment', ce: 'Комментари дӀайаккха' },
  'Комментарий сохранён': { en: 'Comment saved', ce: 'Комментари Ӏалашйина' },
  'Комментарий удалён': { en: 'Comment deleted', ce: 'Комментари дӀаяьккхина' },
  'Глава {n}': { en: 'Chapter {n}', ce: '{n}-гӀа дакъа' },

  'Источник текста: {x}': { en: 'Text source: {x}', ce: 'Йаззаман хьост: {x}' },
  'Прогресс чтения': { en: 'Reading progress', ce: 'Дешаран кхиам' },
  'Глава {n}: {title}': { en: 'Chapter {n}: {title}', ce: '{n}-гӀа дакъа: {title}' },
  Продолжить: { en: 'Continue', ce: 'ДӀадеша' },
  'Закладка добавлена': { en: 'Bookmark added', ce: 'Закладка тӀетоьхна' },
  Действия: { en: 'Actions', ce: 'ГӀуллакхаш' },
  'Изменить метаданные': { en: 'Edit metadata', ce: 'Хаамаш нийсбан' },
  'Сбросить прогресс': { en: 'Reset progress', ce: 'Прогресс юхахӀотто' },
  'Прогресс сброшен': { en: 'Progress reset', ce: 'Прогресс юхахӀоттийна' },
  'Удалить книгу': { en: 'Delete book', ce: 'Жайна дӀайаккха' },
  Метаданные: { en: 'Metadata', ce: 'Хаамаш' },
  Название: { en: 'Title', ce: 'ЦӀе' },
  Автор: { en: 'Author', ce: 'Яздархо' },
  Жанр: { en: 'Genre', ce: 'Жанр' },
  Описание: { en: 'Description', ce: 'Цуьнах лаьцна' },
  Сохранить: { en: 'Save', ce: 'Ӏалашдан' },
  Сохранено: { en: 'Saved', ce: 'Ӏалашдина' },

  'Загрузите файл книги': { en: 'Upload a book file', ce: 'Жайнин файл чуяха' },
  'Импорт…': { en: 'Importing…', ce: 'ЧуйогӀуш…' },
  'Выбрать файл': { en: 'Choose file', ce: 'Файл харжа' },
  'Также можно': { en: 'You can also', ce: 'ХӀара а мегар ду' },
  'Открыть с устройства': { en: 'Open from device', ce: 'ГӀирсера схьаделла' },
  'Файловый менеджер телефона': { en: "Phone's file manager", ce: 'Телефонан файлийн урхалла' },
  'По локальному пути': { en: 'By local path', ce: 'Меттигерчу некъаца' },
  'Открыть книгу из папки устройства': { en: 'Open a book from a device folder', ce: 'ГӀирсан папкера жайна схьаделла' },
  'Отсканировать текст': { en: 'Scan text', ce: 'Текст скан ян' },
  'Распознавание текста с фото (скоро)': { en: 'Text recognition from photo (soon)', ce: 'Суьрта тӀера текст йовзар (кестта)' },
  'Все книги хранятся только на вашем устройстве. Аккаунт и интернет не требуются.': {
    en: 'All books stay on your device only. No account or internet needed.',
    ce: 'Дерриг жайнаш хьан гӀирсехь бен ца Ӏалашдо. Аккаунт а, интернет а оьшуш йац.',
  },
  'Книга добавлена в библиотеку': { en: 'Book added to the library', ce: 'Жайна библиотекан тӀетоьхна' },
  'Добавлено книг: {n}': { en: 'Books added: {n}', ce: 'ТӀетоьхна жайна: {n}' },
  'Не удалось импортировать файл': { en: 'Could not import the file', ce: 'Файл чуяккха аьтто ца белира' },
  'Неизвестный автор': { en: 'Unknown author', ce: 'Ца вевза яздархо' },

  'Название, автор или жанр': { en: 'Title, author or genre', ce: 'ЦӀе, яздархо я жанр' },
  'Недавние поиски': { en: 'Recent searches', ce: 'Керара лахарш' },
  Очистить: { en: 'Clear', ce: 'ЦӀандан' },
  'Найдено: {n}': { en: 'Found: {n}', ce: 'Карийна: {n}' },
  'Ничего не найдено в библиотеке': { en: 'Nothing found in the library', ce: 'Библиотекехь цхьа а хӀума ца карийра' },
  подкатегории: { en: 'subcategories', ce: 'кӀелйолу категореш' },

  'Внешний вид': { en: 'Appearance', ce: 'Берриг куц' },
  Язык: { en: 'Language', ce: 'Мотт' },
  'Чтение по умолчанию': { en: 'Default reading', ce: 'Дешаран стандарт' },
  Библиотека: { en: 'Library', ce: 'Библиотека' },
  'Моя библиотека': { en: 'My library', ce: 'Сан библиотека' },
  Версия: { en: 'Version', ce: 'Верси' },
  'Эти параметры применяются ко всем книгам, где вы не меняли чтение отдельно.': {
    en: 'These options apply to every book where you have not changed reading settings separately.',
    ce: 'ХӀокху параметраш массо жайнашна лаьтта, шайна настройкаш нийсйина ца елахь.',
  },

  'Размер шрифта': { en: 'Font size', ce: 'Шрифтан йоккхалла' },
  Шрифт: { en: 'Font', ce: 'Шрифт' },
  'Межстрочный интервал': { en: 'Line spacing', ce: 'МогӀанийн юкъаралла' },
  'Интервал между абзацами': { en: 'Paragraph spacing', ce: 'Абзацийн юкъаралла' },
  Выравнивание: { en: 'Alignment', ce: 'Нийсдар' },
  'Цвет фона': { en: 'Background', ce: 'Фонан бос' },
  Яркость: { en: 'Brightness', ce: 'Серло' },
  Белый: { en: 'White', ce: 'КӀайн' },
  Сепия: { en: 'Sepia', ce: 'Сепия' },
  'Тёмно-серый': { en: 'Dark grey', ce: 'ТаьӀна-сира' },
  'Чёрный (OLED)': { en: 'Black (OLED)', ce: 'Ӏаьржа (OLED)' },

  'Закладка сохранена': { en: 'Bookmark saved', ce: 'Закладка Ӏалашйина' },
  'Заметка сохранена': { en: 'Note saved', ce: 'Билгало Ӏалашйина' },
  'Цитата в заметках': { en: 'Quote saved to notes', ce: 'Цитата билгалонашкахь ю' },
  'Такая заметка уже есть': { en: 'This note already exists', ce: 'Иштта билгало ю' },
  Предыдущая: { en: 'Previous', ce: 'Хьалхара' },
  Следующая: { en: 'Next', ce: 'ТӀаьхьара' },
  'от всей книги': { en: 'of the book', ce: 'ерриге жайнех' },
  Оглавление: { en: 'Contents', ce: 'Чулацам' },
  Текст: { en: 'Text', ce: 'Текст' },
  'Настройки текста': { en: 'Text settings', ce: 'Текстан нисдарш' },
  'Закладки и история': { en: 'Bookmarks and history', ce: 'Билгалдахарш а, истори а' },
  Закладки: { en: 'Bookmarks', ce: 'Билгалдахарш' },
  '+ Добавить закладку': { en: '+ Add bookmark', ce: '+ Билгалдахар тӀетоха' },
  'Пока нет закладок': { en: 'No bookmarks yet', ce: 'Билгалдахарш дац' },
  'История позиций': { en: 'Position history', ce: 'Меттигийн истори' },
  'Заметка к главе «{title}»': { en: 'Note for chapter “{title}”', ce: '«{title}» декъан билгало' },
  'Сохранить заметку': { en: 'Save note', ce: 'Билгало Ӏалашъян' },
  'В этой книге заметок пока нет. Печатать не обязательно: зажмите пальцем слово и протяните на нужную фразу — над выделением появится «В заметки».': {
    en: 'This book has no notes yet. You do not have to type: hold a word and drag over the phrase — “To notes” will appear above the selection.',
    ce: 'ХӀокху жайни чохь билгалонаш яц. ТӀеязъян оьшуш дац: пӀелгца дош лаьцна дӀаоза — лакхахь «Билгалонна» гучудер ду.',
  },
  'Поиск по книге': { en: 'Search in book', ce: 'Жайни чохь лахар' },
  'Введите текст…': { en: 'Enter text…', ce: 'Текст йазде…' },
  'Совпадений нет': { en: 'No matches', ce: 'Цхьа а хӀума ца карийра' },
  'В заметки': { en: 'To notes', ce: 'Билгалонна' },

  'Неподдерживаемый формат. Выберите EPUB, FB2, TXT или PDF.': {
    en: 'Unsupported format. Choose EPUB, FB2, TXT or PDF.',
    ce: 'ХӀара формат тӀе ца оьцу. EPUB, FB2, TXT я PDF харжа.',
  },
  'EPUB повреждён: нет container.xml': { en: 'EPUB is broken: no container.xml', ce: 'EPUB телхина: container.xml дац' },
  'В EPUB не найдено содержимое': { en: 'No content found in the EPUB', ce: 'EPUB чохь чулацам ца карийра' },
  'Не удалось извлечь текст из PDF': { en: 'Could not extract text from the PDF', ce: 'PDF-ера текст схьаэца аьтто ца белира' },
  'Страница {n}': { en: 'Page {n}', ce: 'АгӀо {n}' },

  МБ: { en: 'MB', ce: 'МБ' },
  КБ: { en: 'KB', ce: 'КБ' },
  сегодня: { en: 'today', ce: 'тахана' },
  вчера: { en: 'yesterday', ce: 'селхана' },
  '{n} дн. назад': { en: '{n} days ago', ce: '{n} де хьалха' },
  '{n} нед. назад': { en: '{n} weeks ago', ce: '{n} кӀира хьалха' },
  '{n} мес. назад': { en: '{n} months ago', ce: '{n} бутт хьалха' },
}

let currentLang: Lang = 'ru'

export function setLang(l: Lang) {
  currentLang = l
}

export function getLang(): Lang {
  return currentLang
}

// для дат и времени: 'ce' движок браузера может не знать — тогда остаётся русская разметка чисел
export function localeOf(): string {
  return currentLang === 'en' ? 'en-GB' : currentLang === 'ce' ? 'ru' : 'ru'
}

function fill(s: string, vars?: Record<string, string | number>) {
  if (!vars) return s
  return s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m))
}

export function t(key: string, vars?: Record<string, string | number>): string {
  if (currentLang === 'ru') return fill(key, vars)
  const pair = DICT[key]
  return fill(pair ? pair[currentLang] : key, vars)
}

export function translatedKeys(): string[] {
  return Object.keys(DICT)
}

function ru(n: number, forms: [string, string, string]): string {
  const k = n % 100
  const d = k % 10
  if (k > 10 && k < 20) return forms[2]
  if (d === 1) return forms[0]
  if (d > 1 && d < 5) return forms[1]
  return forms[2]
}

export function unit(
  n: number,
  forms: { ru: [string, string, string]; en: [string, string]; ce: string },
): string {
  if (currentLang === 'en') return `${n} ${n === 1 ? forms.en[0] : forms.en[1]}`
  // после числительного нохчийн ставит существительное в единственном числе: «кхо де», «исс корта»
  if (currentLang === 'ce') return `${n} ${forms.ce}`
  return `${n} ${ru(n, forms.ru)}`
}

export const notesWord = (n: number) => unit(n, { ru: ['заметка', 'заметки', 'заметок'], en: ['note', 'notes'], ce: 'билгало' })
export const bookWord = (n: number) => unit(n, { ru: ['книга', 'книги', 'книг'], en: ['book', 'books'], ce: 'жайна' })
export const chapterWord = (n: number) => unit(n, { ru: ['глава', 'главы', 'глав'], en: ['chapter', 'chapters'], ce: 'дакъа' })
