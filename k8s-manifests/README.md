# Развертывание в Kubernetes для Social Network Webinars

Этот каталог содержит манифесты Kubernetes для развертывания приложения Social Network Webinars в кластере Kubernetes.

## Обзор архитектуры

Приложение состоит из следующих микросервисов:

- **Frontend**: Приложение Next.js (порт 3000)
- **API Gateway**: Шлюз NestJS (порт 3000)
- **Auth Service**: Сервис аутентификации (порт 3001)
- **Email Service**: Сервис отправки email (порт 3002)
- **User Service**: Управление пользователями (порт 3003)
- **Message Service**: Функциональность сообщений (порт 3004)
- **Post Service**: Управление постами (порт 3005)
- **File Service**: Загрузка/скачивание файлов (порт 3006)
- **PostgreSQL**: База данных (порт 5432)
- **MinIO**: Объектное хранилище (порты 9000, 9001)

## Предварительные требования

1. **Кластер Kubernetes**: Работающий кластер Kubernetes (v1.20+)
2. **kubectl**: Настроенный для подключения к вашему кластеру
3. **Ingress Controller**: Установленный NGINX Ingress Controller
4. **Storage Class**: Класс хранения по умолчанию (названный "standard" в манифестах)
5. **Container Registry**: Доступ к реестру `registry_name.cr.cloud.ru`

## Быстрый старт

### 1. Генерация секретов

Перед развертыванием необходимо сгенерировать секреты:

```bash
# Скопируйте шаблон и заполните значениями
cp .env.secrets.template .env.secrets

# Отредактируйте .env.secrets с вашими значениями
nano .env.secrets

# Сгенерируйте secret.yaml
./generate-secrets.sh
```

### 2. Развертывание приложения

Используйте скрипт развертывания для автоматического развертывания всех компонентов:

```bash
# Запустить полное развертывание
./deploy.sh
```

Или примените все манифесты вручную:

```bash
kubectl apply -f .
```

### 3. Проверка развертывания

```bash
# Проверить все поды
kubectl get pods -n social-network

# Проверить сервисы
kubectl get services -n social-network

# Проверить ingress
kubectl get ingress -n social-network
```

## Доступ к приложению

После развертывания вы можете получить доступ к приложению по следующим URL:

- **Frontend**: `http://social-network.local`
- **API**: `http://api.social-network.local`

### Настройка для локальной разработки

Для локальной разработки добавьте эти записи в ваш файл `/etc/hosts`:

```
<IP-адрес сервиса LoadBalancer для ingress контроллера> social-network.local
<IP-адрес сервиса LoadBalancer для ingress контроллера> api.social-network.local
<IP-адрес сервиса LoadBalancer для ingress контроллера> minio.social-network.local
```


## Конфигурация

### Переменные окружения

Приложение использует ConfigMaps и Secrets Kubernetes для конфигурации:

- **ConfigMap**: Нечувствительная конфигурация (`configmap.yaml`)
- **Secret**: Чувствительные данные, такие как пароли и токены (`secret.yaml`)

### Конфигурация базы данных

PostgreSQL развернут как StatefulSet с постоянным хранилищем. База данных автоматически инициализируется необходимыми схемами.

### Объектное хранилище

MinIO развернут для объектного хранилища с постоянным хранилищем. Учетные данные настраиваются через секреты.

## Управление развертыванием

### Очистка

Для удаления всего развертывания используйте скрипт очистки:

```bash
# Удалить все компоненты
./cleanup.sh
```

Или удалите вручную:

```bash
kubectl delete namespace social-network
```

### Просмотр логов

```bash
# Просмотр логов для конкретного сервиса
kubectl logs -f deployment/api-gateway -n social-network

# Просмотр логов всех подов
kubectl logs -f --all-containers=true -n social-network
```

### Проверки работоспособности

Все сервисы включают проверки живучести и готовности. Проверьте статус подов:

```bash
kubectl describe pods -n social-network
```