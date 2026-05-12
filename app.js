window.onload = function() {
    const tg = window.Telegram.WebApp;
    tg.expand();

    let steps = 0;
    let isSensorActive = false;
    
    // ПАРАМЕТРЫ ПРОФЕССИОНАЛЬНОГО ФИЛЬТРА
    let lastStepTime = 0;
    const MIN_STEP_INTERVAL = 380; // Человек не может шагать быстрее 3 раз в сек
    const MAX_STEP_INTERVAL = 2000; // Если пауза больше 2 сек - это не бег/ходьба
    const STEP_THRESHOLD = 14.5;   // Высокий порог: отсекает взмахи рук
    
    // Буфер для анализа "ритма"
    let stepHistory = [];

    const stepDisplay = document.getElementById('step-count');
    const userName = document.getElementById('user-name');
    const userPhoto = document.getElementById('user-photo');

    // 1. Загрузка данных
    tg.CloudStorage.getItem('userSteps', (err, value) => {
        if (!err && value) {
            steps = parseInt(value);
            stepDisplay.innerText = steps;
        }
    });

    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        userName.innerText = tg.initDataUnsafe.user.first_name;
        if (tg.initDataUnsafe.user.photo_url) userPhoto.src = tg.initDataUnsafe.user.photo_url;
    }

    // 2. АЛГОРИТМ "АНТИ-ЧИТ"
    function handleMotion(event) {
        const acc = event.accelerationIncludingGravity;
        if (!acc) return;

        const force = Math.sqrt(acc.x**2 + acc.y**2 + acc.z**2);
        const now = Date.now();

        // Проверка 1: Сила толчка должна быть выше порога
        if (force > STEP_THRESHOLD) {
            const interval = now - lastStepTime;

            // Проверка 2: Ритмичность (Анти-тряска)
            // Если интервал слишком короткий (тряска) или слишком длинный - игнорим
            if (interval > MIN_STEP_INTERVAL && interval < MAX_STEP_INTERVAL) {
                
                steps++;
                stepDisplay.innerText = steps;
                lastStepTime = now;

                // Вибрация (обратная связь)
                tg.HapticFeedback.impactOccurred('medium');

                // Сохранение (раз в 5 шагов для экономии трафика)
                if (steps % 5 === 0) {
                    tg.CloudStorage.setItem('userSteps', steps.toString());
                }
            }
        }
    }

    // 3. Инициализация
    function initSensors() {
        if (isSensorActive) return;
        
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
            DeviceMotionEvent.requestPermission().then(state => {
                if (state === 'granted') {
                    window.addEventListener('devicemotion', handleMotion);
                    isSensorActive = true;
                }
            });
        } else {
            window.addEventListener('devicemotion', handleMotion);
            isSensorActive = true;
        }
    }

    // Кнопки
    document.getElementById('bonus-btn').onclick = function() {
        const today = new Date().toDateString();
        tg.CloudStorage.getItem('lastBonusDate', (err, date) => {
            if (date !== today) {
                steps += 100;
                stepDisplay.innerText = steps;
                tg.CloudStorage.setItem('userSteps', steps.toString());
                tg.CloudStorage.setItem('lastBonusDate', today);
                tg.showAlert("Бонус зачислен!");
            } else {
                tg.showAlert("Сегодня бонус уже был.");
            }
        });
        initSensors();
    };

    document.getElementById('double-btn').onclick = function() {
        tg.showAlert("Трекинг запущен. Положи телефон в карман.");
        initSensors();
    };
};