# Frontend Социальной Сети

Это демонстрационное приложение социальной сети для серии вебинаров.

Современное приложение социальной сети, созданное с использованием Next.js, React и TypeScript.

## Функции

- **Аутентификация**: Безопасные процессы входа и регистрации.
- **Лента**: Интерактивная лента пользователя с поддержкой постов и медиа.
- **Профили**: Полноценные профили пользователей с аватарами и биографией.
- **Чат**: Система обмена сообщениями в реальном времени с поиском пользователей.
- **Интернационализация**: Полная поддержка нескольких языков (i18n).
- **Адаптивный дизайн**: Mobile-first интерфейс с использованием Tailwind CSS.
- **Тёмная тема**: Нативная поддержка тёмной темы с возможностью переключения.

## Технологический стек

- **Фреймворк**: [Next.js 16](https://nextjs.org/) (App Router)
- **Библиотека UI**: [React 19](https://react.dev/), [Shadcn UI](https://ui.shadcn.com/)
- **Стилизация**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Управление состоянием**: [React Query](https://tanstack.com/query/latest)
- **Обработка форм**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Интернационализация**: [i18next](https://www.i18next.com/)
- **Иконки**: [Lucide React](https://lucide.dev/)

## Начало работы

### Предварительные требования

- Node.js (рекомендуется v22+)
- Yarn или NPM

### Установка

1. Клонируйте репозиторий:

   ```bash
   git clone <repository-url>
   ```

2. Установите зависимости:

   ```bash
   yarn install
   # или
   npm install
   ```

3. Настройте переменные окружения:
   Скопируйте `env.example` в `.env.local` (или создайте его) и обновите значения.

   ```bash
   cp env.example .env.local
   ```

   | Переменная            | Описание               | По умолчанию            |
   | --------------------- | ---------------------- | ----------------------- |
   | `NEXT_PUBLIC_API_URL` | URL API бэкенда        | `http://localhost:3000` |

4. Запустите сервер разработки:

   ```bash
   yarn dev
   # или
   npm run dev
   ```

   Приложение запустится по адресу [http://localhost:3007](http://localhost:3007).

## Скрипты

### Разработка

- `yarn dev`: Запускает сервер разработки на порту 3007.
- `yarn build`: Собирает приложение для продакшена.
- `yarn start`: Запускает продкашен сервер.
- `yarn lint`: Запускает ESLint для проверки качества кода.
- `yarn format`: Форматирует код с помощью Prettier.

### Docker - Образ приложения

- `yarn docker:build`: Собирает Docker образ.
- `yarn docker:tag`: Тегирует Docker образ для реестра.
- `yarn docker:push`: Отправляет Docker образ в реестр.
- `yarn deploy`: Запускает сборку, тегирование и отправку последовательно.

### Docker - Базовые образы

- `yarn docker:build-base-build`: Собирает образ base-build.
- `yarn docker:tag-base-build`: Тегирует образ base-build для реестра.
- `yarn docker:push-base-build`: Отправляет образ base-build в реестр.
- `yarn docker:deploy-base-build`: Деплоит образ base-build (сборка + тегирование + отправка).
- `yarn docker:build-base-run`: Собирает образ base-run.
- `yarn docker:tag-base-run`: Тегирует образ base-run для реестра.
- `yarn docker:push-base-run`: Отправляет образ base-run в реестр.
- `yarn docker:deploy-base-run`: Деплоит образ base-run (сборка + тегирование + отправка).
- `yarn docker:deploy-requirements`: Деплоит оба базовых образа.

## Архитектура Docker

Приложение использует **многоэтапную сборку Docker** с пользовательскими базовыми образами, хранящимися в частном реестре (`registry_name.cr.cloud.ru`). Эта архитектура оптимизирует время сборки и уменьшает размер образа.

### Базовые образы

Процесс сборки зависит от двух базовых образов:

1. **base-build** (`registry_name.cr.cloud.ru/social-network-frontend/base-build:latest`)
   - Основан на `node:22-alpine`
   - Включает `libc6-compat` для совместимости
   - Используется для установки зависимостей и сборки приложения

2. **base-run** (`registry_name.cr.cloud.ru/social-network-frontend/base-run:latest`)
   - Основан на `node:22-alpine`
   - Минимальный образ для выполнения
   - Используется для финального продакшен контейнера

### Поток сборки Docker

```
┌─────────────────────────────────────────────────────────────────┐
│              Базовые Образы (Частный Реестр)                     │
├──────────────────────────────┬──────────────────────────────────┤
│   base-build:latest          │   base-run:latest                │
│   (node:22-alpine +          │   (node:22-alpine)               │
│    libc6-compat)             │                                  │
└──────────────┬───────────────┴──────────────┬───────────────────┘
               │                              │
               ▼                              │
       ┌───────────────┐                      │
       │  deps этап    │                      │
       │  (установка   │                      │
       │   пакетов)    │                      │
       └───────┬───────┘                      │
               │                              │
               ▼                              │
       ┌───────────────┐                      │
       │ builder этап  │                      │
       │ (сборка прил) │                      │
       └───────┬───────┘                      │
               │                              │
               └──────────────┐               │
                              ▼               ▼
                      ┌────────────────────────────┐
                      │     runner этап            │
                      │  (продакшен образ)         │
                      │  - Копия standalone вывода │
                      │  - Копия стат. файлов      │
                      │  - Non-root user (nextjs)  │
                      └────────────┬───────────────┘
                                   │
                                   ▼
                      ┌────────────────────────────┐
                      │  Финальный Продакшен Образ │
                      │  social-network-frontend   │
                      │  (Оптимизирован & Минимал) │
                      └────────────────────────────┘
```

### Этапы сборки

#### Предварительный этап

Замените `registry_name` на имя вашего репозитория в Artifact Registry.

Основной `Dockerfile` использует трехэтапный процесс сборки:

1. **deps**: Устанавливает зависимости с помощью `yarn --frozen-lockfile`
2. **builder**: Собирает приложение Next.js в автономном режиме
3. **runner**: Создает минимальный продакшен образ только с необходимыми файлами

### Команды Docker

#### Управление базовыми образами

```bash
# Сборка и деплой образа base-build
yarn docker:deploy-base-build

# Сборка и деплой образа base-run
yarn docker:deploy-base-run

# Деплой обоих базовых образов
yarn docker:deploy-requirements
```

Отдельные шаги для базовых образов:

```bash
# Base-build
yarn docker:build-base-build   # Сборка base-build
yarn docker:tag-base-build     # Тегирование для реестра
yarn docker:push-base-build    # Отправка в реестр

# Base-run
yarn docker:build-base-run     # Сборка base-run
yarn docker:tag-base-run       # Тегирование для реестра
yarn docker:push-base-run      # Отправка в реестр
```

#### Образ приложения

```bash
# Полный деплой (сборка + тегирование + отправка)
yarn deploy

# Отдельные шаги
yarn docker:build   # Сборка образа приложения
yarn docker:tag     # Тегирование как registry_name.cr.cloud.ru/social-network-frontend:latest
yarn docker:push    # Отправка в реестр
```

### Запуск с Docker

Чтобы запустить контейнер локально:

```bash
docker run -p 3000:3000 registry_name.cr.cloud.ru/social-network-frontend:latest
```

Или используя локальный тег:

```bash
docker run -p 3000:3000 social-network-frontend
```

### Первоначальная настройка

При настройке проекта в первый раз или после обновления версии Node.js:

1. Сначала задеплойте базовые образы:
   ```bash
   yarn docker:deploy-requirements
   ```

2. Затем соберите и задеплойте приложение:
   ```bash
   yarn deploy
   ```

## Структура проекта

```
src/
├── app/          # Страницы и макеты Next.js App Router
├── components/   # Переиспользуемые UI компоненты
│   ├── auth/     # Компоненты аутентификации
│   ├── chat/     # Компоненты чата и сообщений
│   ├── feed/     # Компоненты ленты и постов
│   ├── ui/       # Примитивы Shadcn UI
│   └── ...
├── lib/          # Утилиты и API клиенты
├── hooks/        # Пользовательские хуки React
└── ...
```

## Лицензия

MIT
