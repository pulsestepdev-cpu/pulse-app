function initApp() {
    const tg = window.Telegram?.WebApp;
    if (tg) tg.expand();

    let steps = 0;
    const stepDisplay = document.getElementById('step-count');
    const userName = document.getElementById('user-name');
    const userPhoto = document.getElementById('user-photo');

    // 1. Показываем имя (в браузере будет 'Гость')
    if (tg?.initDataUnsafe?.user) {
        userName.innerText = tg.initDataUnsafe.user.first_name;
        if (tg.initDataUnsafe.user.photo_url) userPhoto.src = tg.initDataUnsafe.user.photo_url;
    } else {
        userName.innerText = "Гость (Браузер)";
    }

    // 2. Кнопки
    const dBtn = document.getElementById('double-btn');
    const bBtn = document.getElementById('bonus-btn');

    if (dBtn) {
        dBtn.onclick = function() {
            console.log("Клик x2");
            // Проверяем, есть ли интерфейс Телеграма
            if (window.Telegram?.WebApp?.showAlert) {
                window.Telegram.WebApp.showAlert("Множитель активирован!");
            } else {
                alert("Кнопка x2 работает!");
            }
            initSensors();
        };
    }

    if (bBtn) {
        bBtn.onclick = function() {
            console.log("Клик Бонус");
            steps += 100;
            if (stepDisplay) stepDisplay.innerText = steps;
            
            if (window.Telegram?.WebApp?.showAlert) {
                window.Telegram.WebApp.showAlert("Бонус +100 шагов зачислен!");
            } else {
                alert("Бонус начислен!");
            }
            initSensors();
        };
    }
}

// Запуск только после полной загрузки страницы
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}