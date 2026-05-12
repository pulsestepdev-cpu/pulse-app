window.onload = function() {
    const tg = window.Telegram.WebApp;
    tg.expand();

    let steps = 0;
    let isSensorActive = false;
    
    // Переменные для фильтрации "шума" (чтобы не считало махи руками)
    let lastStepTime = 0;
    const stepCooldown = 350; // Минимум 350мс между шагами (физика человека)
    const sensitivity = 13.5; // Порог силы толчка (отсекает простые движения)

    const stepDisplay = document.getElementById('step-count');
    const userName = document.getElementById('user-name');
    const userPhoto = document.getElementById('user-photo');

    // 1. ЗАГРУЗКА ДАННЫХ
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

    // 2. УМНЫЙ ШАГОМЕР (Эмуляция железного датчика)
    function handleMotion(event) {
        const acc = event.accelerationIncludingGravity;
        if (!acc) return;

        // Считаем векторную сумму всех сил
        const totalForce = Math.sqrt(acc.x**2 + acc.y**2 + acc.z**2);
        const now = Date.now();

        // Условие: резкий импульс (шаг) + достаточное время с прошлого шага
        if (totalForce > sensitivity && (now - lastStepTime) > stepCooldown) {
            steps++;
            stepDisplay.innerText = steps;
            lastStepTime = now;

            // Вибрация подтверждает, что шаг засчитан
            tg.HapticFeedback.impactOccurred('medium');

            // Сохраняем каждые 2 шага, чтобы не терять прогресс
            if (steps % 2 === 0) {
                tg.CloudStorage.setItem('userSteps', steps.toString());
            }
        }
    }

    // 3. ЗАПУСК ДВИГАТЕЛЯ (Активация датчиков)
    function initSensors() {
        if (isSensorActive) return;

        if (typeof DeviceMotionEvent.requestPermission === 'function') {
            // Для iOS (iPhone)
            DeviceMotionEvent.requestPermission().then(state => {
                if (state === 'granted') {
                    window.addEventListener('devicemotion', handleMotion);
                    isSensorActive = true;
                    console.log("Сенсоры iOS запущены");
                }
            }).catch(e => console.error(e));
        } else {
            // Для Android
            window.addEventListener('devicemotion', handleMotion);
            isSensorActive = true;
            console.log("Сенсоры Android запущены");
        }
    }

    // 4. КНОПКИ С ЛОГИКОЙ
    const bonusBtn = document.getElementById('bonus-btn');
    const doubleBtn = document.getElementById('double-btn');

    if (bonusBtn) {
        bonusBtn.onclick = function() {
            const today = new Date().toDateString();
            
            tg.CloudStorage.getItem('lastBonusDate', (err, lastDate) => {
                if (lastDate === today) {
                    tg.showAlert("Бонус уже получен! Жди завтрашнего дня.");
                } else {
                    steps += 100;
                    stepDisplay.innerText = steps;
                    tg.CloudStorage.setItem('userSteps', steps.toString());
                    tg.CloudStorage.setItem('lastBonusDate', today);
                    tg.showAlert("Бонус +100 шагов зачислен!");
                    tg.HapticFeedback.notificationOccurred('success');
                }
            });
            initSensors(); // Включаем датчики при нажатии
        };
    }

    if (doubleBtn) {
        doubleBtn.onclick = function() {
            tg.showAlert("Режим отслеживания включен. Удачи на прогулке!");
            tg.HapticFeedback.impactOccurred('heavy');
            initSensors(); // Включаем датчики при нажатии
        };
    }

    // Резервный запуск при любом клике по экрану
    document.body.onclick = initSensors;
};