/**
 * GREEN-API JavaScript Integration
 * Полнофункциональный интерфейс для работы с WhatsApp API
 */

class GreenAPIClient {
    constructor() {
        this.baseUrl = 'https://api.green-api.com';
        this.responseArea = null;
        this.isLoading = false;
        this.init();
    }

    init() {
        // Инициализация после загрузки DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
        } else {
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        this.responseArea = document.getElementById('responseArea');

        // Добавляем обработчики событий
        this.addWelcomeMessage();
        this.setupBrowserAnimation();
        this.setupRealTimeValidation();
    }

    // ==================== ВАЛИДАЦИЯ ====================

    /**
     * Валидация учетных данных
     */
    validateCredentials() {
        const idInstance = document.getElementById('idInstance').value.trim();
        const apiToken = document.getElementById('apiToken').value.trim();

        const errors = [];

        // Валидация ID Instance
        if (!idInstance) {
            errors.push('ID Instance не может быть пустым');
        } else if (!/^\d+$/.test(idInstance)) {
            errors.push('ID Instance должен содержать только цифры');
        } else if (idInstance.length < 10 || idInstance.length > 15) {
            errors.push('ID Instance должен содержать от 10 до 15 цифр');
        }

        // Валидация API Token
        if (!apiToken) {
            errors.push('API Token не может быть пустым');
        } else if (apiToken.length < 50) {
            errors.push('API Token слишком короткий (минимум 50 символов)');
        } else if (!/^[a-fA-F0-9]+$/.test(apiToken)) {
            errors.push('API Token должен содержать только шестнадцатеричные символы');
        }

        if (errors.length > 0) {
            this.logError('Ошибки валидации:', errors);
            return null;
        }

        return { idInstance, apiToken };
    }

    /**
     * Валидация номера телефона
     */
    validatePhoneNumber(phone) {
        if (!phone) {
            return 'Номер телефона не может быть пустым';
        }

        // Проверяем формат: цифры@c.us или цифры-группа@g.us
        const phoneRegex = /^(\d{10,15})@(c\.us|g\.us)$/;
        if (!phoneRegex.test(phone)) {
            return 'Неверный формат номера. Используйте: 79876543210@c.us для личных чатов или номер@g.us для групп';
        }

        return null;
    }

    /**
     * Валидация URL
     */
    validateUrl(url) {
        if (!url) {
            return 'URL не может быть пустым';
        }

        try {
            const urlObj = new URL(url);
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                return 'URL должен начинаться с http:// или https://';
            }
            return null;
        } catch (error) {
            return 'Неверный формат URL';
        }
    }

    /**
     * Реальное время валидации полей
     */
    setupRealTimeValidation() {
        const inputs = ['idInstance', 'apiToken'];

        inputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('input', () => this.validateFieldRealTime(input));
                input.addEventListener('blur', () => this.validateFieldRealTime(input));
            }
        });
    }

    validateFieldRealTime(input) {
        const value = input.value.trim();
        const fieldName = input.id;

        // Удаляем предыдущие стили ошибок
        input.classList.remove('error', 'success');

        if (!value) {
            return;
        }

        let isValid = false;

        if (fieldName === 'idInstance') {
            isValid = /^\d+$/.test(value) && value.length >= 10 && value.length <= 15;
        } else if (fieldName === 'apiToken') {
            isValid = value.length >= 50 && /^[a-fA-F0-9]+$/.test(value);
        }

        input.classList.add(isValid ? 'success' : 'error');
    }

    // ==================== ЛОГИРОВАНИЕ И ОТОБРАЖЕНИЕ ====================

    /**
     * Добавление сообщения в область ответов
     */
    addToResponse(message, type = 'info') {
        if (!this.responseArea) return;

        const timestamp = new Date().toLocaleString('ru-RU');
        const icon = this.getMessageIcon(type);
        const formattedMessage = `[${timestamp}] ${icon} ${message}\n\n`;

        this.responseArea.value += formattedMessage;
        this.responseArea.scrollTop = this.responseArea.scrollHeight;
    }

    /**
     * Логирование успешного ответа
     */
    logSuccess(message, data) {
        const formattedData = this.formatJSON(data);
        this.addToResponse(`УСПЕХ: ${message}\n${formattedData}`, 'success');
    }

    /**
     * Логирование ошибки
     */
    logError(message, errors = null) {
        let errorMessage = `ОШИБКА: ${message}`;

        if (errors) {
            if (Array.isArray(errors)) {
                errorMessage += '\n• ' + errors.join('\n• ');
            } else if (typeof errors === 'object') {
                errorMessage += '\n' + this.formatJSON(errors);
            } else {
                errorMessage += `\n${errors}`;
            }
        }

        this.addToResponse(errorMessage, 'error');
    }

    /**
     * Логирование информации
     */
    logInfo(message) {
        this.addToResponse(message, 'info');
    }

    /**
     * Логирование загрузки
     */
    logLoading(message) {
        this.addToResponse(`⏳ ${message}`, 'loading');
    }

    /**
     * Получение иконки для типа сообщения
     */
    getMessageIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️',
            loading: '⏳',
            warning: '⚠️'
        };
        return icons[type] || 'ℹ️';
    }

    /**
     * Форматирование JSON для читаемости
     */
    formatJSON(obj) {
        if (!obj) return 'null';

        try {
            // Если это уже строка JSON, парсим её
            if (typeof obj === 'string') {
                obj = JSON.parse(obj);
            }

            return JSON.stringify(obj, null, 2)
                .replace(/^/gm, '  ') // Добавляем отступ
                .replace(/^\s\s/gm, ''); // Убираем первый отступ
        } catch (error) {
            return String(obj);
        }
    }

    // ==================== СЕТЕВЫЕ ЗАПРОСЫ ====================

    /**
     * Универсальный метод для отправки запросов
     */
    async makeRequest(url, options = {}) {
        if (this.isLoading) {
            this.logError('Дождитесь завершения предыдущего запроса');
            return null;
        }

        this.isLoading = true;
        this.setLoadingState(true);

        try {
            const defaultOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 30000 // 30 секунд таймаут
            };

            const requestOptions = { ...defaultOptions, ...options };

            this.logLoading(`Отправка ${requestOptions.method} запроса: ${url}`);

            // Создаем промис с таймаутом
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), requestOptions.timeout);

            const response = await fetch(url, {
                ...requestOptions,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // Получаем данные ответа
            let data;
            const contentType = response.headers.get('content-type');

            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            // Обрабатываем ответ
            if (response.ok) {
                this.logSuccess(`Запрос выполнен успешно (${response.status})`, data);
                return { success: true, data, status: response.status };
            } else {
                this.logError(`HTTP ошибка (${response.status} ${response.statusText})`, data);
                return { success: false, data, status: response.status, error: response.statusText };
            }

        } catch (error) {
            if (error.name === 'AbortError') {
                this.logError('Превышено время ожидания запроса (30 сек)');
            } else if (error instanceof TypeError) {
                this.logError('Сетевая ошибка. Проверьте подключение к интернету', error.message);
            } else {
                this.logError('Неожиданная ошибка при выполнении запроса', error.message);
            }
            return null;
        } finally {
            this.isLoading = false;
            this.setLoadingState(false);
        }
    }

    /**
     * Построение URL для API
     */
    buildApiUrl(credentials, method) {
        return `${this.baseUrl}/waInstance${credentials.idInstance}/${method}/${credentials.apiToken}`;
    }

    // ==================== API МЕТОДЫ ====================

    /**
     * Получение настроек инстанса
     */
    async getSettings() {
        const credentials = this.validateCredentials();
        if (!credentials) return;

        const url = this.buildApiUrl(credentials, 'getSettings');
        const result = await this.makeRequest(url);

        if (result && result.success) {
            this.logInfo('📋 Настройки инстанса получены успешно');
        }
    }

    /**
     * Получение состояния инстанса
     */
    async getStateInstance() {
        const credentials = this.validateCredentials();
        if (!credentials) return;

        const url = this.buildApiUrl(credentials, 'getStateInstance');
        const result = await this.makeRequest(url);

        if (result && result.success) {
            this.logInfo('📊 Состояние инстанса получено успешно');
        }
    }

    /**
     * Получение версии WhatsApp
     */
    async getWaVersion() {
        const credentials = this.validateCredentials();
        if (!credentials) return;

        const url = this.buildApiUrl(credentials, 'getWaVersion');
        const result = await this.makeRequest(url);

        if (result && result.success) {
            this.logInfo('📱 Версия WhatsApp получена успешно');
        }
    }

    /**
     * Отправка текстового сообщения
     */
    async sendMessage() {
        const credentials = this.validateCredentials();
        if (!credentials) return;

        const chatId = document.getElementById('messagePhone').value.trim();
        const message = document.getElementById('messageText').value.trim();

        // Валидация данных сообщения
        const phoneError = this.validatePhoneNumber(chatId);
        if (phoneError) {
            this.logError(phoneError);
            return;
        }

        if (!message) {
            this.logError('Текст сообщения не может быть пустым');
            return;
        }

        if (message.length > 4096) {
            this.logError('Сообщение слишком длинное (максимум 4096 символов)');
            return;
        }

        const url = this.buildApiUrl(credentials, 'sendMessage');
        const result = await this.makeRequest(url, {
            method: 'POST',
            body: JSON.stringify({
                chatId: chatId,
                message: message
            })
        });

        if (result && result.success) {
            this.logInfo(`💬 Сообщение отправлено в чат: ${chatId}`);
            // Очищаем поля после успешной отправки
            document.getElementById('messageText').value = '';
        }
    }

    /**
     * Отправка файла по URL
     */
    async sendFileByUrl() {
        const credentials = this.validateCredentials();
        if (!credentials) return;

        const chatId = document.getElementById('filePhone').value.trim();
        const urlFile = document.getElementById('fileUrl').value.trim();
        const fileName = document.getElementById('fileName').value.trim();
        const caption = document.getElementById('fileCaption').value.trim();

        // Валидация данных
        const phoneError = this.validatePhoneNumber(chatId);
        if (phoneError) {
            this.logError(phoneError);
            return;
        }

        const urlError = this.validateUrl(urlFile);
        if (urlError) {
            this.logError(urlError);
            return;
        }

        if (!fileName) {
            this.logError('Имя файла не может быть пустым');
            return;
        }

        // Проверяем расширение файла
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.mp3', '.mp4', '.avi'];
        const hasValidExtension = allowedExtensions.some(ext =>
            fileName.toLowerCase().endsWith(ext)
        );

        if (!hasValidExtension) {
            this.logError(`Поддерживаемые форматы файлов: ${allowedExtensions.join(', ')}`);
            return;
        }

        const requestBody = {
            chatId: chatId,
            urlFile: urlFile,
            fileName: fileName
        };

        if (caption) {
            requestBody.caption = caption;
        }

        const url = this.buildApiUrl(credentials, 'sendFileByUrl');
        const result = await this.makeRequest(url, {
            method: 'POST',
            body: JSON.stringify(requestBody)
        });

        if (result && result.success) {
            this.logInfo(`📎 Файл "${fileName}" отправлен в чат: ${chatId}`);
            // Очищаем поля после успешной отправки
            document.getElementById('fileUrl').value = '';
            document.getElementById('fileName').value = '';
            document.getElementById('fileCaption').value = '';
        }
    }

    // ==================== ДОПОЛНИТЕЛЬНЫЕ МЕТОДЫ ====================

    /**
     * Отправка локации
     */
    async sendLocation() {
        const credentials = this.validateCredentials();
        if (!credentials) return;

        const chatId = document.getElementById('locationPhone')?.value.trim();
        const latitude = document.getElementById('latitude')?.value.trim();
        const longitude = document.getElementById('longitude')?.value.trim();

        if (!chatId || !latitude || !longitude) {
            this.logError('Заполните все поля для отправки локации');
            return;
        }

        const phoneError = this.validatePhoneNumber(chatId);
        if (phoneError) {
            this.logError(phoneError);
            return;
        }

        // Валидация координат
        if (isNaN(latitude) || isNaN(longitude)) {
            this.logError('Координаты должны быть числами');
            return;
        }

        const url = this.buildApiUrl(credentials, 'sendLocation');
        const result = await this.makeRequest(url, {
            method: 'POST',
            body: JSON.stringify({
                chatId: chatId,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude)
            })
        });

        if (result && result.success) {
            this.logInfo(`📍 Локация отправлена в чат: ${chatId}`);
        }
    }

    /**
     * Получение QR кода
     */
    async getQRCode() {
        const credentials = this.validateCredentials();
        if (!credentials) return;

        const url = this.buildApiUrl(credentials, 'qr');
        const result = await this.makeRequest(url);

        if (result && result.success) {
            this.logInfo('📱 QR код получен успешно');
        }
    }

    // ==================== УТИЛИТЫ UI ====================

    /**
     * Установка состояния загрузки
     */
    setLoadingState(loading) {
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(button => {
            button.disabled = loading;
            if (loading) {
                button.classList.add('loading');
                button.style.opacity = '0.6';
            } else {
                button.classList.remove('loading');
                button.style.opacity = '1';
            }
        });
    }

    /**
     * Очистка области ответов
     */
    clearResponse() {
        if (this.responseArea) {
            this.responseArea.value = '';
            this.addToResponse('🧹 Область ответов очищена');
        }
    }

    /**
     * Копирование ответов в буфер обмена
     */
    async copyResponse() {
        if (!this.responseArea || !this.responseArea.value) {
            this.logError('Нет данных для копирования');
            return;
        }

        try {
            await navigator.clipboard.writeText(this.responseArea.value);
            this.addToResponse('📋 Ответы скопированы в буфер обмена');
        } catch (error) {
            // Fallback для старых браузеров
            this.responseArea.select();
            document.execCommand('copy');
            this.addToResponse('📋 Ответы скопированы в буфер обмена');
        }
    }

    /**
     * Экспорт логов в файл
     */
    exportLogs() {
        if (!this.responseArea || !this.responseArea.value) {
            this.logError('Нет логов для экспорта');
            return;
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `green-api-logs-${timestamp}.txt`;

        const blob = new Blob([this.responseArea.value], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.logInfo(`💾 Логи экспортированы в файл: ${filename}`);
    }

    /**
     * Приветственное сообщение
     */
    addWelcomeMessage() {
        this.addToResponse('🎉 GREEN-API Interface успешно загружен!');
        this.addToResponse('📝 Заполните ID Instance и API Token для начала работы');
        this.addToResponse('🔍 Все действия будут отображаться в этой области');
        this.addToResponse('────────────────────────────────────────');
    }

    /**
     * Анимация браузерных кнопок
     */
    setupBrowserAnimation() {
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = 'scale(1)';
                }, 100);
            });
        });
    }

    /**
     * Получение статистики использования API
     */
    getApiStats() {
        const logs = this.responseArea.value;
        const lines = logs.split('\n').filter(line => line.trim());

        const stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            methods: {}
        };

        lines.forEach(line => {
            if (line.includes('УСПЕХ:')) {
                stats.successfulRequests++;
                stats.totalRequests++;
            } else if (line.includes('ОШИБКА:')) {
                stats.failedRequests++;
                stats.totalRequests++;
            }

            // Подсчет методов
            const methodMatch = line.match(/(getSettings|getStateInstance|sendMessage|sendFileByUrl)/);
            if (methodMatch) {
                const method = methodMatch[1];
                stats.methods[method] = (stats.methods[method] || 0) + 1;
            }
        });

        this.logInfo('📈 СТАТИСТИКА ИСПОЛЬЗОВАНИЯ API:');
        this.logInfo(`   Всего запросов: ${stats.totalRequests}`);
        this.logInfo(`   Успешных: ${stats.successfulRequests}`);
        this.logInfo(`   Ошибок: ${stats.failedRequests}`);
        this.logInfo(`   Успешность: ${stats.totalRequests > 0 ? Math.round(stats.successfulRequests / stats.totalRequests * 100) : 0}%`);

        if (Object.keys(stats.methods).length > 0) {
            this.logInfo('   Использованные методы:');
            Object.entries(stats.methods).forEach(([method, count]) => {
                this.logInfo(`     ${method}: ${count} раз`);
            });
        }
    }
}

// Инициализация глобального экземпляра
const greenAPI = new GreenAPIClient();

// Глобальные функции для совместимости с HTML
function getSettings() {
    greenAPI.getSettings();
}

function getStateInstance() {
    greenAPI.getStateInstance();
}

function sendMessage() {
    greenAPI.sendMessage();
}

function sendFileByUrl() {
    greenAPI.sendFileByUrl();
}

function clearResponse() {
    greenAPI.clearResponse();
}

function copyResponse() {
    greenAPI.copyResponse();
}

// Дополнительные глобальные функции
function exportLogs() {
    greenAPI.exportLogs();
}

function showApiStats() {
    greenAPI.getApiStats();
}

function getQRCode() {
    greenAPI.getQRCode();
}

// CSS стили для валидации (добавляем динамически)
const validationStyles = `
    <style>
        .input-group input.error {
            border-color: #e53e3e !important;
            box-shadow: 0 0 0 3px rgba(229, 62, 62, 0.1) !important;
        }

        .input-group input.success {
            border-color: #25d366 !important;
            box-shadow: 0 0 0 3px rgba(37, 211, 102, 0.1) !important;
        }

        .btn.loading {
            position: relative;
            pointer-events: none;
        }

        .btn.loading::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 16px;
            height: 16px;
            margin: -8px 0 0 -8px;
            border: 2px solid transparent;
            border-top: 2px solid currentColor;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .api-method.disabled {
            opacity: 0.6;
            pointer-events: none;
        }

        .response-area {
            font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace !important;
        }
    </style>
`;

// Добавляем стили в head
document.head.insertAdjacentHTML('beforeend', validationStyles);

// Экспорт для модульных систем
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GreenAPIClient;
}
