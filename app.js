window.onload = function() {
    const tg = window.Telegram.WebApp;
    tg.expand();

    let steps = 0;
    let lastX, lastY, lastZ;
    let isSensorActive = false;

    const stepDisplay = document.getElementById('step-count');
    const userName = document.getElementById('user-name');
    const userPhoto = document.getElementById('user-photo');

    // 1. Загрузка данных
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

    // 2. Улучшенный алгоритм шагов (чувствительный к ходьбе)
    function handleMotion(event) {
        let acc = event.acceleration; // Используем ускорение БЕЗ гравитации
        if (!acc || acc.x === null) return;

        if (lastX !== undefined) {
            let deltaX = Math.abs(acc.x - lastX);
            let deltaY = Math.abs(acc.y - lastY);
            let deltaZ = Math.abs(acc.z - lastZ);

            // Порог 2.5 для чистого ускорения — это стандарт для ходьбы в руке
            if (deltaX + deltaY + deltaZ > 2.5) {
                steps++;
                stepDisplay.innerText = steps;
                
                // Мгновенное сохранение в память каждые 2 шага
                if (steps % 2 === 0) {
                    tg.CloudStorage.setItem('userSteps', steps.toString());
                    tg.HapticFeedback.impactOccurred('light');
                }
            }
        }
        
        lastX = acc.x;
        lastY = acc.y;
        lastZ = acc.z;
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

    // 3. Кнопки с проверкой времени
    const bonusBtn = document.getElementById('bonus-btn');
    const doubleBtn = document.getElementById('double-btn');

    if (bonusBtn) {
        bonusBtn.onclick = function() {
            const today = new Date().toDateString(); // Получаем текущую дату (напр. "Tue May 12 2026")

            tg.CloudStorage.getItem('lastBonusDate', (err, lastDate) => {
                if (lastDate === today) {
                    tg.showAlert("Ты уже забирал бонус сегодня! Приходи завтра.");
                } else {
                    steps += 100;
                    stepDisplay.innerText = steps;
                    tg.CloudStorage.setItem('userSteps', steps.toString());
                    tg.CloudStorage.setItem('lastBonusDate', today); // Запоминаем день
                    tg.showAlert("Бонус +100 зачислен!");
                    tg.HapticFeedback.notificationOccurred('success');
                }
            });
            initSensors();
        };
    }

    if (doubleBtn) {
        doubleBtn.onclick = function() {
            tg.showAlert("Множитель активен! Считаем каждый шаг.");
            initSensors();
        };
    }

    document.body.onclick = initSensors;
};