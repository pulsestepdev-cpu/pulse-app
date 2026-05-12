window.onload = function() {
    const tg = window.Telegram.WebApp;
    tg.expand();

    // Настройки твоего сервера
    const SERVER_URL = 'http://127.0.0.1:8000'; // Пока работаем локально
    let steps = 0;

    const stepDisplay = document.getElementById('step-count');
    const userName = document.getElementById('user-name');
    const userPhoto = document.getElementById('user-photo');
    const statusText = document.getElementById('status-text'); // Если есть такой элемент для статуса

    // 1. Отображение данных пользователя из Telegram
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        userName.innerText = tg.initDataUnsafe.user.first_name;
        if (tg.initDataUnsafe.user.photo_url) userPhoto.src = tg.initDataUnsafe.user.photo_url;
    }

    // 2. ГЛАВНАЯ ФУНКЦИЯ: Получение реальных шагов с сервера
    async function syncSteps() {
        try {
            const response = await fetch(`${SERVER_URL}/steps`);
            const data = await response.json();
            
            if (data.today_steps !== undefined) {
                steps = data.today_steps;
                stepDisplay.innerText = steps;
                
                // Сохраняем в облако Telegram как резервную копию
                tg.CloudStorage.setItem('userSteps', steps.toString());
                
                // Визуальная обратная связь
                if (statusText) statusText.innerText = "Данные синхронизированы";
            } else if (data.error) {
                console.error("Ошибка сервера:", data.error);
                if (statusText) statusText.innerText = "Нужна авторизация Google";
            }
        } catch (error) {
            console.error("Сервер недоступен:", error);
            if (statusText) statusText.innerText = "Сервер оффлайн";
        }
    }

    // 3. Логика кнопок
    document.getElementById('bonus-btn').onclick = function() {
        const today = new Date().toDateString();
        tg.CloudStorage.getItem('lastBonusDate', (err, date) => {
            if (date !== today) {
                // Бонус теперь просто прибавляется к общему числу визуально, 
                // но в идеале такие вещи лучше считать на бэкенде
                tg.showAlert("Бонус зачислен! Зайди в Google Fit, чтобы обновить базу.");
                tg.CloudStorage.setItem('lastBonusDate', today);
                syncSteps(); // Обновляем данные
            } else {
                tg.showAlert("Сегодня бонус уже был.");
            }
        });
    };

    // Кнопка "Запустить" теперь просто принудительно обновляет данные
    document.getElementById('double-btn').onclick = function() {
        tg.HapticFeedback.notificationOccurred('success');
        syncSteps();
        tg.showAlert("Синхронизация с Google Fit запущена!");
    };

    // 4. ИНИЦИАЛИЗАЦИЯ
    // Запускаем синхронизацию сразу при входе
    syncSteps();

    // И обновляем каждые 2 минуты, чтобы не дергать сервер слишком часто
    setInterval(syncSteps, 120000);
};