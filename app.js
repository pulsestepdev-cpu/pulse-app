const tg = window.Telegram.WebApp;
tg.expand();

let steps = 0;
const stepDisplay = document.getElementById('step-count');
const userName = document.getElementById('user-name');
const userPhoto = document.getElementById('user-photo');

// 1. Инициализация данных пользователя
if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
    const user = tg.initDataUnsafe.user;
    userName.innerText = user.first_name;
    if (user.photo_url) userPhoto.src = user.photo_url;
}

// 2. Логика счетчика шагов
let lastAcceleration = 0;
function handleMotion(event) {
    let acc = event.accelerationIncludingGravity;
    if (!acc) return;

    let totalAcc = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);
    let delta = Math.abs(totalAcc - lastAcceleration);

    if (delta > 12) { 
        steps++;
        stepDisplay.innerText = steps;
        // Вибрация только на каждый 5-й шаг, чтобы не бесить
        if (steps % 5 === 0) tg.HapticFeedback.impactOccurred('light'); 
    }
    lastAcceleration = totalAcc;
}

// 3. Функция запроса датчиков
function initSensors() {
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission()
            .then(state => {
                if (state === 'granted') window.addEventListener('devicemotion', handleMotion);
            });
    } else {
        window.addEventListener('devicemotion', handleMotion);
    }
}

// 4. Прямая привязка кнопок по ID (самый надежный способ)
document.getElementById('double-btn').onclick = function() {
    tg.HapticFeedback.notificationOccurred('success');
    tg.showAlert('Множитель x2 активирован! (Пока в тестовом режиме)');
    initSensors(); // Заодно пробуем запустить датчики
};

document.getElementById('double-btn').onclick = function() {
    alert('Проверка: Кнопка нажата!'); // Эту строчку поймет ЛЮБОЙ браузер
    tg.HapticFeedback.notificationOccurred('success');
    tg.showAlert('Множитель x2 активирован!');
    initSensors();
};
document.getElementById('bonus-btn').onclick = function() {
    tg.HapticFeedback.impactOccurred('medium');
    tg.showConfirm('Забрать бонус за сегодня?', (confirmed) => {
        if (confirmed) tg.showAlert('Вы получили +100 бонусных шагов!');
    });
    initSensors();
};

// Пробуем запустить датчики при любом клике по экрану
document.body.onclick = initSensors;