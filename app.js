window.onload = function() {
    const tg = window.Telegram.WebApp;
    tg.expand();

    let steps = 0;
    let lastAcceleration = 0;
    let isSensorActive = false;

    const stepDisplay = document.getElementById('step-count');
    const userName = document.getElementById('user-name');
    const userPhoto = document.getElementById('user-photo');

    // 1. Настройка профиля
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const user = tg.initDataUnsafe.user;
        userName.innerText = user.first_name;
        if (user.photo_url) userPhoto.src = user.photo_url;

        // Загружаем шаги из памяти Telegram
        tg.CloudStorage.getItem('userSteps', (err, value) => {
            if (!err && value) {
                steps = parseInt(value);
                stepDisplay.innerText = steps;
            }
        });
    }

    // 2. ДВИГАТЕЛЬ ШАГОВ (Чувствительный)
    function handleMotion(event) {
        let acc = event.accelerationIncludingGravity;
        if (!acc) return;

        // Считаем вектор движения
        let totalAcc = Math.sqrt(acc.x**2 + acc.y**2 + acc.z**2);
        let delta = Math.abs(totalAcc - lastAcceleration);

        // Порог 8.0 — поймает даже легкий шаг
        if (delta > 8.0) { 
            steps++;
            stepDisplay.innerText = steps;
            
            // Вибрация на каждый шаг для обратной связи
            tg.HapticFeedback.impactOccurred('light'); 
            
            // Сохраняем в облако каждые 5 шагов
            if (steps % 5 === 0) {
                tg.CloudStorage.setItem('userSteps', steps.toString());
            }
        }
        lastAcceleration = totalAcc;
    }

    // 3. ЗАПУСК ДАТЧИКОВ
    function initSensors() {
        if (isSensorActive) return;

        if (typeof DeviceMotionEvent.requestPermission === 'function') {
            // Для iPhone (iOS)
            DeviceMotionEvent.requestPermission()
                .then(state => {
                    if (state === 'granted') {
                        window.addEventListener('devicemotion', handleMotion);
                        isSensorActive = true;
                    }
                });
        } else {
            // Для Android
            window.addEventListener('devicemotion', handleMotion);
            isSensorActive = true;
        }
    }

    // 4. ОБРАБОТКА КНОПОК
    const doubleBtn = document.getElementById('double-btn');
    const bonusBtn = document.getElementById('bonus-btn');

    if (doubleBtn) {
        doubleBtn.onclick = function() {
            tg.HapticFeedback.notificationOccurred('success');
            tg.showAlert('Множитель x2 активирован!');
            initSensors(); // Запускаем датчики при нажатии
        };
    }

    if (bonusBtn) {
        bonusBtn.onclick = function() {
            tg.HapticFeedback.impactOccurred('medium');
            steps += 100;
            stepDisplay.innerText = steps;
            tg.CloudStorage.setItem('userSteps', steps.toString());
            tg.showAlert('Бонус +100 шагов зачислен!');
            initSensors(); // Запускаем датчики при нажатии
        };
    }

    // Запуск датчиков при любом тапе по экрану (для надежности)
    document.body.onclick = initSensors;
};