// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;

// Расширяем приложение на весь экран
tg.expand();

// Получаем данные пользователя
const userCard = document.getElementById('user-card');
const userName = document.getElementById('user-name');
const userPhoto = document.getElementById('user-photo');

if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
    const user = tg.initDataUnsafe.user;
    userName.innerText = `${user.first_name} ${user.last_name || ''}`;
    
    if (user.photo_url) {
        userPhoto.src = user.photo_url;
    } else {
        // Если фото нет, скроем сломанный значок или поставим заглушку
        userPhoto.style.display = 'none';
    }
}

// Логика кнопок
document.querySelector('.btn-neon').addEventListener('click', () => {
    tg.showAlert('Функция удвоения шагов будет доступна в следующей версии!');
});

document.querySelector('.btn-glass').addEventListener('click', () => {
    tg.HapticFeedback.impactOccurred('medium'); // Вибрация телефона
    tg.showConfirm('Забрать ежедневный бонус?');
});