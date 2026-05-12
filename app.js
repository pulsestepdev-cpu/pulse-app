window.onload = function() {
    const tg = window.Telegram.WebApp;
    tg.expand();

    let steps = 0;
    let isSensorActive = false;

    const stepDisplay = document.getElementById('step-count');
    const userName = document.getElementById('user-name');
    const userPhoto = document.getElementById('user-photo');

    // 1. Загрузка данных пользователя и его шагов
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        userName.innerText = tg.initDataUnsafe.user.first_name;
        if (tg.initDataUnsafe.user.photo_url) userPhoto.src = tg.initDataUnsafe.user.photo_url;

        tg.CloudStorage.getItem('userSteps', (err, value) => {
            if (!err && value) {
                steps = parseInt(value);
                stepDisplay.innerText = steps;
            }
        });
    }

    // 2. ФУНКЦИЯ УМНОГО ПОДСЧЕТА (Используем встроенный фильтр телефона)
    let stepThreshold = 10.5; // Оптимальный порог для ходьбы
    let lastStepTime = 0;

    function handleMotion(event) {
        const acc = event.accelerationIncludingGravity;
        if (!acc) return;

        // Считаем общую силу ускорения
        const totalAcc = Math.sqrt(acc.x**2 + acc.y**2 + acc.z**2);
        
        const now = Date.now();
        // Условие: сила удара шага + пауза между шагами (не чаще 4 раз в секунду)
        // Это отсекает "дребезг" при качании телефона
        if (totalAcc > stepThreshold && (now - lastStepTime) > 250) {
            steps++;
            stepDisplay.innerText = steps;
            lastStepTime = now;

            // Вибрация только на реальный шаг
            tg.HapticFeedback.impactOccurred('light');

            // Сохраняем в облако каждые 5 реальных шагов
            if (steps % 5 === 0) {
                tg.CloudStorage.setItem('userSteps', steps.toString());
            }
        }
    }

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

    // 3. ЛОГИКА КНОПОК
    const bonusBtn = document.getElementById('bonus-btn');
    const doubleBtn = document.getElementById('double-btn');

    if (bonusBtn) {
        bonusBtn.onclick = function() {
            const today = new Date().toDateString();
            tg.CloudStorage.getItem('lastBonusDate', (err, lastDate) => {
                if (lastDate === today) {
                    tg.showAlert("Бонус уже получен. Возвращайся завтра!");
                } else {
                    steps += 100;
                    stepDisplay.innerText = steps;
                    tg.CloudStorage.setItem('userSteps', steps.toString());
                    tg.CloudStorage.setItem('lastBonusDate', today);
                    tg.showAlert("Бонус +100 зачислен!");
                }
            });
            initSensors();
        };
    }

    if (doubleBtn) {
        doubleBtn.onclick = function() {
            tg.showAlert("Режим отслеживания шагов активен!");
            initSensors();
        };
    }

    document.body.onclick = initSensors;
};