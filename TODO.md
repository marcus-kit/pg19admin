# TODO — Рефакторинг pg19v3admin

Продолжение рефакторинга по CODE-STYLE.md.

## Выполнено (сессия 2026-01-26)

- [x] **Типы**: 73 ESLint warnings → 0 (все `any` заменены на конкретные типы)
- [x] **Мёртвый код**: удалён закомментированный код в `server/utils/openai.ts`
- [x] **XSS**: добавлено экранирование в `CoverageMap.vue` (v-html)
- [x] **Loading**: унифицировано — 12 файлов переведены на `<UiLoading />`
- [x] **Helper функции**: добавлены `getErrorStatusCode()`, `getErrorMessage()` в `useFormatters.ts`
- [x] **Mappers**: расширен `server/utils/mappers.ts` новыми типами

## Осталось сделать

### Высокий приоритет

- [ ] **Порядок атрибутов в template** — проверить соответствие CODE-STYLE.md:
  ```
  v-if → v-for → :key → ref → v-model → :props → @events → class
  ```
  Можно использовать ESLint rule `vue/attributes-order`

- [ ] **Структура script setup** — проверить порядок секций:
  ```
  1. TYPE IMPORTS
  2. COMPILER MACROS (definePageMeta, defineProps, defineEmits)
  3. COMPOSABLES
  4. REACTIVE STATE
  5. COMPUTED
  6. FUNCTIONS
  7. WATCHERS
  8. LIFECYCLE HOOKS
  ```

### Средний приоритет

- [ ] **Комментарии на русском** — добавить где отсутствуют (особенно в сложных функциях)

- [ ] **console.log в проде** — проверить что нет лишних console.log (только console.error для ошибок)

- [ ] **Магические строки** — заменить на константы где это имеет смысл:
  - Статусы: `'active'`, `'blocked'`, `'closed'` → константы
  - Роли: `'admin'`, `'moderator'` → константы

### Низкий приоритет

- [ ] **Именование компонентов** — проверить что все имеют минимум 2 слова (избежать конфликтов с HTML)

- [ ] **Дублирование UI** — при желании можно создать:
  - `UiSearchInput` — поисковый input с иконкой
  - `UiStatusTabs` — табы фильтрации по статусу

## Полезные команды

```bash
# Проверить ESLint
pnpm lint

# Автоисправление стилистических ошибок
pnpm lint:fix

# Найти все console.log (кроме .error)
grep -rn "console\.log" --include="*.vue" --include="*.ts" app server | grep -v "\.error"

# Найти магические строки статусов
grep -rn "'active'\|'blocked'\|'closed'" --include="*.vue" app/pages
```

## Заметки

- `useAdminList` composable уже унифицирует логику list-страниц — не трогать
- При рефакторинге структуры script setup — не ломать функциональность, только переставлять секции
- Комментарии добавлять только где логика неочевидна — не перекомментировать
