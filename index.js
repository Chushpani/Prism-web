const API_URL = 'https://api.prism-sub.ru/api';
const loginOverlay = document.getElementById('login-overlay');
  const registerOverlay = document.getElementById('register-overlay');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const openRegisterBtn = document.getElementById('open-register');
  let profile = ' ';

let currentSubs = [];

// блок для бека
// Функция для загрузки подписок
async function fetchSubscriptions(email) {
    try {
        const response = await fetch(`${API_URL}/subscriptions/by-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        });
        const result = await response.json();

        if (result.status === "success") {
            // ВОТ ЭТО ДОБАВЬ И СМОТРИ В КОНСОЛЬ БРАУЗЕРА:
            console.log("ДАННЫЕ ИЗ БАЗЫ:", result.subscriptions); 
            
            currentSubs = result.subscriptions; 
            renderSubscriptions(currentSubs);
            checkUpcomingPayments(currentSubs);
        }
    } catch (err) {
        console.error("Ошибка загрузки данных:", err);
    }
}

// Функция отрисовки
function renderSubscriptions(subs) {
    const activeContainer = document.getElementById('active-subs-container');
    const historyContainer = document.getElementById('history-subs-container');
    
    activeContainer.innerHTML = '';
    historyContainer.innerHTML = '';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    subs.forEach(sub => {
        const endDate = new Date(sub.end_date);
        const row = document.createElement('div');
        row.className = 'stroke';
        // Привязываем ID подписки к строке
        row.dataset.id = sub.id; 

        row.innerHTML = `
            <p>${sub.service_name}</p>
            <p class="editable" data-field="start_date">${sub.start_date}</p>
            <p class="editable" data-field="end_date">${sub.end_date}</p>
            <p class="editable" data-field="price">${sub.price}р</p>
            <div class="controls">       
                <button class="add-usage-btn" onclick="registerUsage(${sub.id}, event)">+1</button>
                <p class="palka">|</p>       
                <button class="delete-btn" title="Удалить" data-id="${sub.id}">×</button>
            </div>
        `;
        // ${endDate >= today ? '<button class="activity-btn active" title="Подписка активна"></button>' : ''} если надо будет вернуть

        if (endDate >= today) {
            activeContainer.appendChild(row);
        } else {
            historyContainer.appendChild(row);
        }
    });
}

// --- УМНОЕ УВЕДОМЛЕНИЕ ---
let pendingNotifications = []; // Хранилище для текстов уведомлений

function checkUpcomingPayments(subs) {
    // Функция для получения чистой даты YYYY-MM-DD без учета часовых поясов
    const formatDate = (date) => {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const todayStr = formatDate(new Date());
    
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    const tomorrowStr = formatDate(tom);

    const yes = new Date();
    yes.setDate(yes.getDate() - 1);
    const yesterdayStr = formatDate(yes);

    pendingNotifications = [];

    subs.forEach(sub => {
        // Отрезаем время, если оно есть (2024-03-22 10:00 -> 2024-03-22)
        const subDate = sub.end_date.split(' ')[0];

        if (subDate === tomorrowStr) {
            pendingNotifications.push(`<b>Завтра списание:</b> ${sub.price}р за ${sub.service_name}`);
        } else if (subDate === todayStr) {
            pendingNotifications.push(`<b>Сегодня последний день:</b> ${sub.service_name}`);
        } else if (subDate === yesterdayStr) {
            pendingNotifications.push(`<b>Истекла вчера:</b> ${sub.service_name}`);
        }
    });

    // Вызываем обновление баджа СРАЗУ
    updateNotificationBadge();
}

function updateNotificationBadge() {
    const badge = document.querySelector('.uveda');
    if (pendingNotifications.length > 0) {
        badge.textContent = pendingNotifications.length;
        badge.style.display = 'flex'; // Сделаем flex, чтобы цифра была по центру
    } else {
        badge.style.display = 'none';
    }
}

function updateNotificationBadge() {
    const badge = document.querySelector('.uveda');
    if (pendingNotifications.length > 0) {
        badge.textContent = pendingNotifications.length;
        badge.style.display = 'flex'; // Показываем красный кружок
    } else {
        badge.style.display = 'none';
    }
}

// Обработчик клика по колокольчику
document.getElementById('notification').addEventListener('click', () => {
    const listContainer = document.getElementById('notification-list');
    
    // Если список уже открыт — закрываем
    if (listContainer.classList.contains('show')) {
        listContainer.classList.remove('show');
        return;
    }

    if (pendingNotifications.length === 0) {
        alert("Уведомлений нет!");
        return;
    }

    // Рендерим список
    listContainer.innerHTML = pendingNotifications
        .map(text => `<div class="notif-item">${text}</div>`)
        .join('');
    
    listContainer.classList.add('show');
});

// --- ИНТЕГРАЦИЯ ФОРМЫ ---

// Регистрация
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = registerForm.email.value;
    const password = registerForm.password.value;
    const confirmPassword = registerForm['confirm-password'].value;
    const imap_password = registerForm['app-password'].value;

    if (password !== confirmPassword) {
        alert('Пароли не совпадают!');
        return;
    }

    // --- ВКЛЮЧАЕМ ЛОАДЕР ---
    registerForm.style.display = 'none'; // Прячем форму
    const loader = document.getElementById('register-loader');
    if (loader) loader.style.display = 'block'; // Показываем спиннер

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, imap_password })
        });

        const result = await response.json();

        if (response.ok) {
            // Успех — всё закрываем
            localStorage.setItem('userEmail', email);
            profile = email;
            const nameEl = document.getElementById('name');
            if (nameEl) nameEl.textContent = profile;

            registerOverlay.style.display = 'none';
            document.documentElement.style.overflow = 'auto';
            document.body.style.overflow = 'auto';

            alert(`Успешно! Найдено подписок: ${result.found || 0}`);
            fetchSubscriptions(email); 
        } else {
            // Ошибка — возвращаем форму на место
            alert(`Ошибка: ${result.message || 'Этот email уже занят'}`);
            registerForm.style.display = 'block';
            if (loader) loader.style.display = 'none';
        }
    } catch (err) {
        console.error("Ошибка при регистрации:", err);
        alert("Бэкенд прилёг отдохнуть.");
        // Возвращаем форму в случае падения сети
        registerForm.style.display = 'block';
        if (loader) loader.style.display = 'none';
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = loginForm.email.value;
    const password = loginForm.password.value;

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const result = await response.json();

    if (response.ok && result.status === "success") {
            localStorage.setItem('userEmail', result.user_email); 
            
            profile = result.user_email;
            currentSubs = result.subscriptions;
            
            const nameEl = document.getElementById('name');
            if (nameEl) nameEl.innerHTML = profile;

            loginOverlay.style.display = 'none';
            document.documentElement.style.overflow = 'auto';
            document.body.style.overflow = 'auto';

            renderSubscriptions(result.subscriptions);
            checkUpcomingPayments(result.subscriptions);
            
            console.log("Вход выполнен успешно!");
        } else {
            alert(result.message || "Ошибка: Неверный логин или пароль");
        }
    } catch (err) { // <--- ВОТ ЭТОГО НЕ ХВАТАЛО
        console.error("Ошибка сети:", err);
        alert("Бэкенд Prism не отвечает. Проверь консоль.");
    } // <--- И ЭТОЙ СКОБКИ ТОЖЕ
});

const switcher = document.querySelector('.analytics-switcher');
if (switcher) {
    switcher.addEventListener('click', (e) => {
        if (e.target.classList.contains('view-btn')) {
            document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            
            const view = e.target.getAttribute('data-view');
            renderAnalytics(view, currentSubs);
        }
    });
}

// обновление и доп подсинхрон
async function syncSubscriptions(email) {
    console.log("Запускаю фоновую синхронизацию...");
    try {
        // Мы отправляем запрос на синхронизацию
        const response = await fetch(`${API_URL}/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Если твой бэк ждет user_id, то передаем его, 
            // но обычно на этом этапе проще передать email
            body: JSON.stringify({ email: email }) 
        });

        const result = await response.json();
        
        if (result.status === "success" && result.added > 0) {
            console.log(`Найдено новых подписок: ${result.added}`);
            // Если что-то добавилось — перерисовываем список
            fetchSubscriptions(email); 
        } else {
            console.log("Новых подписок не обнаружено.");
        }
    } catch (err) {
        console.error("Ошибка синхронизации:", err);
    }
}

// При загрузке страницы
window.addEventListener('load', () => {
    // Проверяем localStorage, так как при обычном F5 переменная profile обнулится
    const savedEmail = localStorage.getItem('userEmail') || profile;
    
    if (savedEmail && savedEmail.trim() !== '' && savedEmail !== ' ') {
        console.log("Сессия найдена, запускаю обновление данных...");
        profile = savedEmail; // Восстанавливаем переменную для других функций
        
        // Сначала рисуем то, что уже есть в базе (мгновенно)
        fetchSubscriptions(savedEmail); 
        
        // Потом фоном чекаем почту (может занять пару секунд)
        syncSubscriptions(savedEmail);
    }
});

// запрос на удаление
async function deleteSubscription(subId) {
    if (!confirm('Удалить эту подписку из списка?')) return;

    try {
        const response = await fetch(`${API_URL}/subscription/${subId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (response.ok && result.status === "success") {
            console.log(result.message);
            // Перерисовываем список, чтобы подписка исчезла
            fetchSubscriptions(profile);
        } else {
            alert(`Ошибка: ${result.message}`);
        }
    } catch (err) {
        console.error("Ошибка при удалении:", err);
    }
}

async function updateSubscription(subId, updatedData) {

    try {
        const response = await fetch(`${API_URL}/subscription/${subId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });

        const result = await response.json();

        if (response.ok && result.status === "success") {
            console.log("Данные обновлены:", result.data);
            // Скрываем модалку (если она есть) и обновляем список
            // editModal.style.display = 'none'; 
            fetchSubscriptions(profile);
        } else {
            alert(`Ошибка обновления: ${result.message}`);
        }
    } catch (err) {
        console.error("Ошибка при PUT запросе:", err);
    }
}

// редакт
document.addEventListener('click', async (e) => {
    const target = e.target;
    const row = target.closest('.stroke');
    if (!row) return;
    const subId = row.dataset.id;

    // --- 1. ЛОГИКА УДАЛЕНИЯ ---
    if (target.classList.contains('delete-btn')) {
        if (confirm('Удалить подписку?')) {
            await deleteSubscription(subId); // Твоя функция с DELETE запросом
        }
        return;
    }

    // --- 2. ЛОГИКА РЕДАКТИРОВАНИЯ (Инлайн) ---
    if (target.classList.contains('editable')) {
        if (target.querySelector('input')) return; // Чтобы не плодить инпуты

        const field = target.dataset.field;
        const originalValue = target.innerText.replace('р', '');
        
        const input = document.createElement('input');
        input.type = field === 'price' ? 'number' : 'date';
        input.value = originalValue;
        input.className = 'inline-edit-input'; // Добавь стилей по вкусу

        target.innerHTML = '';
        target.appendChild(input);
        input.focus();

        // Сохранение при потере фокуса или нажатии Enter
        const save = async () => {
            const newValue = input.value;
            if (newValue !== originalValue) {
                const data = {};
                data[field] = newValue;
                await updateSubscription(subId, data); // Твоя функция с PUT запросом
            }
            // Возвращаем текст на место (fetchSubscriptions обновит всё красиво, если надо)
            target.innerText = field === 'price' ? newValue + 'р' : newValue;
        };

        input.onblur = save;
        input.onkeydown = (ev) => { if (ev.key === 'Enter') save(); };
    }
});

// запрос на клик 
async function registerUsage(subId, event) {
    // 1. Сначала определяем кнопку, чтобы потом знать, куда вешать бейдж
    const btn = event && (event.currentTarget || event.target);
    
    if (event && typeof event.stopPropagation === 'function') {
        event.stopPropagation();
    }

    const url = `${API_URL}/subscription/${subId}/click`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error(`Ошибка: ${response.status}`);
        const result = await response.json();

        // 2. Только после того, как получили 'result' от сервера, работаем с ним
        if (result.status === "success") {
            const subIndex = currentSubs.findIndex(s => s.id === subId);
            if (subIndex !== -1) {
                // ЗАПИСЫВАЕМ В .click (без S на конце!), чтобы совпало с Flask
                currentSubs[subIndex].clicks = result.new_clicks; 

                if (btn) {
                    showUsageBadge(btn, result.new_clicks);
                }

                // 4. Обновляем интерфейс
                setTimeout(() => {
                    renderSubscriptions(currentSubs);
                    
                    const modal = document.getElementById('analytics-modal');
                    if (modal && modal.style.display === 'block') {
                        const currentView = document.querySelector('.tab-btn.active')?.dataset.view || 'activities';
                        renderAnalytics(currentView, currentSubs);
                    }
                }, 300); 
            }
        }
    } catch (err) {
        console.error("Клик не прошел:", err);
    }
}

// Вспомогательная функция для рендера твоего бейджа
function showUsageBadge(element, totalClicks) {
    const badge = document.createElement('div');
    badge.className = 'usage-badge';
    
    // totalClicks теперь будет целым числом, пришедшим из result.new_clicks
    badge.innerText = `+1 (${totalClicks})`; 
    
    element.style.position = 'relative'; 
    element.appendChild(badge);

    setTimeout(() => badge.remove(), 1800);
}

  // Переключение на регистрацию
  openRegisterBtn.addEventListener('click', () => {
    loginOverlay.style.display = 'none';
    registerOverlay.style.display = 'flex';
  });

  // Логин: закрываем только после успешной валидации


  // Регистрация: проверяем совпадение паролей + валидация
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const password = registerForm.password.value;
    const confirmPassword = registerForm['confirm-password'].value;
    
    if (password !== confirmPassword) {
      alert('Пароли не совпадают!');
      return;
    }
    
    if (registerForm.checkValidity()) {
      profile = registerForm.querySelector('input[type="email"]').value;
      document.getElementById('#2e2e2ed2').innerHTML = profile;
      // fetch('/api/register', { method: 'POST', body: new FormData(registerForm) })
      
      registerOverlay.style.display = 'none';
      document.documentElement.style.overflow = 'auto';
      document.body.style.overflow = 'auto';
    } else {
      registerForm.reportValidity();
    }
  })
  
  document.getElementById('back-to-login').addEventListener('click', () => {
  registerOverlay.style.display = 'none';
  loginOverlay.style.display = 'flex';
});

//КНОПКА ВЫХОДА С АККА "ЛИЧНАЯ РАЗРАБОТКА"

document.getElementById('exit').addEventListener('click', () => {
let conf = confirm("Уверены что хотите выйти?");

  if(conf){
    window.location.reload();
  }
  console.clear();
  //exit из akka
})

///свапер 

const btnActive = document.getElementById('switcher-btn-active');
const btnHistory = document.getElementById('switcher-btn-history');
const contentBox = document.getElementById('content-box');
const historyBox = document.getElementById('history-box');

btnActive.addEventListener('click', () => {
  contentBox.classList.add('show');
  historyBox.classList.remove('show');

  btnActive.classList.add('active-btn');
  btnHistory.classList.remove('active-btn');
});

btnHistory.addEventListener('click', () => {
  historyBox.classList.add('show');
  contentBox.classList.remove('show');

  btnHistory.classList.add('active-btn');
  btnActive.classList.remove('active-btn');
});


// diagramm

// Открытие модалки
document.getElementById('analytics-btn').addEventListener('click', () => {
  document.getElementById('analytics-modal').style.display = 'flex';
  renderAnalytics('service', currentSubs); 
});

// Закрытие
document.getElementById('close-analytics').addEventListener('click', () => {
  document.getElementById('analytics-modal').style.display = 'none';
});

// Переключение вкладок
document.querySelectorAll('.view-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderAnalytics(btn.dataset.view, currentSubs);
  });
});

// Галочки активности
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('activity-btn')) {
    // Скрываем предыдущее сообщение
    const oldMessage = e.target.parentNode.querySelector('.activity-message');
    if (oldMessage) oldMessage.remove();
    
    e.target.classList.toggle('active');
    
    // Проверяем состояние ПЕРЕД toggle и ставим нужный текст
    const wasActive = e.target.classList.contains('active');
    const messageText = wasActive ? 'подписка используется!' : 'подписка неактивна!';
    
    // Создаем новое сообщение
    const message = document.createElement('div');
    message.className = 'activity-message';
    message.textContent = messageText;
    e.target.parentNode.appendChild(message);
    
    setTimeout(() => {
      message.classList.add('show');
      setTimeout(() => {
        message.remove();
      }, 2000);
    }, 100);
  }
});



function getSubscriptions() {
  const strokes = document.querySelectorAll('#content-box .stroke');
  const subs = [];
  
  strokes.forEach((stroke, index) => {
    const name = stroke.querySelector('#subs').textContent;
    const costText = stroke.querySelector('#cost').textContent;
    const cost = parseInt(costText.replace(/[^\d]/g, ''));
    const isActive = stroke.querySelector('.activity-btn').classList.contains('active');
    
    subs.push({ name, price: cost, active: isActive, index });
  });
  
  return subs;
}

async function changeSubCategory(subId, newCat) {
  console.log(`Меняем подписку ${subId} на категорию ${newCat}`); // Для отладки

  if (newCat === "NEW_CAT") {
    newCat = prompt("Введите название новой категории:");
    if (!newCat || newCat.trim() === "") {
        // Если юзер передумал, возвращаем селект в исходное состояние
        renderAnalytics('category', currentSubs);
        return;
    }
  }

  // 1. Ищем подписку в нашем глобальном массиве
  const sub = currentSubs.find(s => String(s.id) === String(subId));
  
  if (sub) {
    const oldCat = sub.category;
    sub.category = newCat; // Меняем категорию в памяти

    // Решаем: остаться в текущей категории или прыгнуть в новую?
    // Давай останемся в текущей, чтобы юзер видел, как подписка «исчезла»
    if (window.currentActiveCat === oldCat && !currentSubs.some(s => s.category === oldCat)) {
        // Если в старой категории больше ничего нет — прыгаем в новую
        window.currentActiveCat = newCat;
    }

    // Мгновенно перерисовываем
    renderAnalytics('category', currentSubs);
  }

  // 2. Стучимся на бэкенд (PATCH)
  try {
    const response = await fetch(`${API_URL}/subscriptions/${subId}/category`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: newCat })
    });

    if (!response.ok) throw new Error("Ошибка сервера");
    console.log("Бэкенд подтвердил смену категории");
  } catch (err) {
    console.error("Сервер не ответил, но в интерфейсе мы поменяли:", err);
    // Опционально: можно откатить изменения назад, если бэкенд упал
  }
}

function renderAnalytics(view, subs) {
  const chartContainer = document.getElementById('chart-container');
  const statsContainer = document.getElementById('summary-stats');
  
  if (!subs || subs.length === 0) {
    chartContainer.innerHTML = "<p style='color:white; text-align:center;'>Нет данных</p>";
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Фильтруем активные
  const activeSubs = subs.filter(sub => {
    const [d, m, y] = sub.end_date.split('.');
    return new Date(`${y}-${m}-${d}`) >= today;
  });

  let data = {};
  let title = '';

  // Логика графиков (оставляем как есть)
if (view === 'service') {
    subs.forEach(sub => {
      const name = sub.service_name || 'Неизвестно';
      data[name] = (data[name] || 0) + Number(sub.price || 0);
    });
    title = 'Траты за все время (₽)';
  } else {
    const now = new Date();
    const curM = now.getMonth(); // Март = 2
    const curY = now.getFullYear();
    
    const prevM = curM === 0 ? 11 : curM - 1;
    const prevY = curM === 0 ? curY - 1 : curY;

    let thisM = 0; 
    let lastM = 0;

    console.log(`Ищем: Текущий (${curM + 1}.${curY}), Прошлый (${prevM + 1}.${prevY})`);

subs.forEach(sub => {
      if (!sub.start_date) return;

      // 1. УНИВЕРСАЛЬНЫЙ ПАРСЕР: кушает и 2026-03-01, и 01.03.2026
      let d, m, y;
      if (sub.start_date.includes('-')) {
        // Формат ГГГГ-ММ-ДД
        [y, m, d] = sub.start_date.split('-').map(Number);
      } else {
        // Формат ДД.ММ.ГГГГ
        [d, m, y] = sub.start_date.split('.').map(Number);
      }

      const subMonth = m - 1; // Переводим в формат JS (0-11)
      const subYear = y;

      // 2. СРАВНЕНИЕ (проверь в консоли, теперь должны быть галочки)
      if (subYear === curY && subMonth === curM) {
        thisM += Number(sub.price || 0);
        console.log(`✅ ${sub.service_name} попал в ТЕКУЩИЙ (${sub.price}₽)`);
      } else if (subYear === prevY && subMonth === prevM) {
        lastM += Number(sub.price || 0);
        console.log(`✅ ${sub.service_name} попал в ПРОШЛЫЙ (${sub.price}₽)`);
      } else {
        console.log(`❌ ${sub.service_name} мимо (Дата: ${sub.start_date}, Ждали: ${curM+1}.${curY} или ${prevM+1}.${prevY})`);
      }
    });

    data = { 'Прошлый': lastM, 'Текущий': thisM };
    title = 'Сравнение месяцев (₽)';
  }

  // --- 1. ЛОГИКА ВКЛАДКИ КАТЕГОРИЙ ---
  if (view === 'category') {
    // Группируем подписки по категориям
    const categories = {};
    subs.forEach(sub => {
      const cat = sub.category || 'Без категории';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(sub);
    });

    const catList = Object.keys(categories);
    // Берем первую категорию как активную, если еще не выбрана
    if (!window.currentActiveCat) window.currentActiveCat = catList[0];

    // Генерим HTML для двух колонок
    let categoryHTML = `
      <div class="category-layout" style="display: flex; gap: 20px; color: white; min-height: 300px; text-align: left;">
        <div class="category-sidebar" style="width: 150px; border-right: 1px solid rgba(255,255,255,0.1); padding-right: 10px;">
          ${catList.map(cat => `
            <div class="cat-tab ${window.currentActiveCat === cat ? 'active-cat' : ''}" 
                 onclick="window.currentActiveCat='${cat}'; renderAnalytics('category', currentSubs)"
                 style="padding: 10px; cursor: pointer; border-radius: 6px; margin-bottom: 5px; font-size: 13px; 
                        background: ${window.currentActiveCat === cat ? 'rgba(255,255,255,0.1)' : 'transparent'}">
              ${cat} (${categories[cat].length})
            </div>
          `).join('')}
        </div>

        <div class="category-main" style="flex: 1;">
          <h4 style="margin-top: 0;">Подписки: ${window.currentActiveCat}</h4>
          <div class="cat-subs-list">
            ${categories[window.currentActiveCat].map(sub => `
              <div class="cat-sub-item" style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); padding: 10px; margin-bottom: 8px; border-radius: 8px;">
                <span>${sub.service_name} (${sub.price}₽)</span>
                
                <select onchange="changeSubCategory('${sub.id}', this.value)" style="background: #1e1e1e; color: white; border: 1px solid #444; border-radius: 4px; font-size: 12px; padding: 2px;">
                   ${catList.map(c => `<option value="${c}" ${c === window.currentActiveCat ? 'selected' : ''}>${c}</option>`).join('')}
                   <option value="NEW_CAT">+ Своя...</option>
                </select>
              </div>
            `).join('')}
          </div>
          <p style="color: #94a3b8; font-size: 14px;">Итого по категории: <b>${categories[window.currentActiveCat].reduce((sum, s) => sum + Number(s.price), 0)} ₽</b></p>
        </div>
      </div>
    `;

    chartContainer.innerHTML = categoryHTML;
    statsContainer.innerHTML = ""; // Очищаем низ, чтобы не мешался
    return; // Выходим, так как нам тут график не нужен
  }
window.changeSubCategory = changeSubCategory;
window.renderAnalytics = renderAnalytics;

  chartContainer.innerHTML = `<canvas id="analytics-chart" width="600" height="250"></canvas>`;
  drawBarChart(document.getElementById('analytics-chart'), Object.entries(data), title);

  // --- 2. КАРТОЧКИ ЭФФЕКТИВНОСТИ ---
  let cardsHTML = `
    <h3 style="color:white; margin: 20px; text-align:center;">Эффективность подписок:</h3>
    <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px;">
  `;

  activeSubs.forEach(sub => {
    const clicks = Number(sub.clicks !== undefined ? sub.clicks : (sub.click || 0));
    // ИСПРАВЛЕНО: везде clicks (с S на конце)
    const price = Number(sub.price || 0);
    const cost = clicks > 0 ? Math.round(price / clicks) : price;

    cardsHTML += `
      <div class="stat-card" style="border-left: 4px solid #d8d8d8; background: rgba(255,255,255,0.03); padding: 12px;">
        <h4 style="margin: 0; font-size: 13px; color: #94a3b8;">${sub.service_name}</h4>
        <div style="margin-top: 8px;">
          <span style="font-size: 18px; font-weight: bold; color: white;">${cost} ₽</span>
          <span style="font-size: 11px; color: #64748b;"> / исп</span>
        </div>
        <p style="margin: 4px 0 0 0; font-size: 11px; color: #d8d8d8;">Использований: ${clicks}</p>
      </div>
    `;
  });
  cardsHTML += `</div>`;

  // --- 3. РЕКОМЕНДАЦИИ ---
  let adviceHTML = '<div class="advice-container" style="color:white; margin: 20px 0 10px 0; text-align:center;"><h3>Рекомендации Prism:</h3>';
  
activeSubs.forEach(sub => {
    const clicks = Number(sub.clicks || 0);
    const price = Number(sub.price || 0);
    const costPerClick = clicks > 0 ? (price / clicks) : price;

    if (clicks === 0) {
        adviceHTML += `
            <div class="advice-item" style="color: #ef4444; border-left: 3px solid #ef4444; padding-left: 10px; margin: 10px 0;">
                ❌ <b>${sub.service_name}</b>: Вы вообще не пользуетесь этой подпиской.
            </div>`;
    } 
    // Если один клик стоит дороже 30% всей подписки (мало заходов)
    else if (costPerClick > (price * 0.3)) {
        adviceHTML += `
            <div class="advice-item" style="color: #f59e0b; border-left: 3px solid #f59e0b; padding-left: 10px; margin: 10px 0;">
                ⚠️ <b>${sub.service_name}</b>: Слишком редкое использование (${Math.round(costPerClick)}₽ за раз). Стоит ли она того?
            </div>`;
    }
    // Если юзаешь очень активно (цена клика копеечная)
    else if (costPerClick < 30 && clicks > 5) {
        adviceHTML += `
            <div class="advice-item" style="color: #10b981; border-left: 3px solid #10b981; padding-left: 10px; margin: 10px 0;">
                💎 <b>${sub.service_name}</b>: Отличная окупаемость! Всего ${Math.round(costPerClick)}₽ за использование.
            </div>`;
    }
});

  statsContainer.innerHTML = cardsHTML + adviceHTML;
}

function drawBarChart(canvas, data, title) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // 1. ДИНАМИЧЕСКИЙ РАЗМЕР
    const parent = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    
    // Берем ширину родителя, но не больше 700
    const vWidth = Math.min(parent.clientWidth - 20, 700); 
    const vHeight = 300; 
    
    canvas.style.width = vWidth + 'px';
    canvas.style.height = vHeight + 'px';
    canvas.width = vWidth * dpr;
    canvas.height = vHeight * dpr;
    
    ctx.scale(dpr, dpr);

    // 2. ОЧИСТКА И ФОН
    ctx.clearRect(0, 0, vWidth, vHeight);
    ctx.fillStyle = '#28292c';
    ctx.beginPath();
    ctx.roundRect(0, 0, vWidth, vHeight, 16);
    ctx.fill();

    if (!data || data.length === 0) return;

    // 3. РАСЧЕТЫ (Тут была ошибка)
    const maxValue = Math.max(...data.map(d => d[1])) || 1; // Возвращаем расчет максимума
    const itemCount = data.length;
    
    // Распределяем место: делим ширину на количество элементов + 1 для отступов
    const spacing = vWidth / (itemCount + 1);
    const barWidth = Math.min(40, spacing * 0.7); // Столбик не шире 40px

    // 4. ЗАГОЛОВОК
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, vWidth / 2, 35);

    // 5. РИСУЕМ ДАННЫЕ
    data.forEach(([label, value], i) => {
        const barHeight = (value / maxValue) * 160;
        // Центрируем каждый столбик в его "секторе"
        const x = (i + 1) * spacing - barWidth / 2;
        const y = vHeight - barHeight - 45;

        // Столбик с градиентом
        const grad = ctx.createLinearGradient(x, y, x, y + barHeight);
        grad.addColorStop(0, '#c2c2c2');
        grad.addColorStop(1, '#919191');
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [6, 6, 0, 0]);
        ctx.fill();

        // Текст сверху (цена)
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(`${Math.round(value)}₽`, x + barWidth/2, y - 10);

        // Подпись снизу (название)
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px sans-serif';
        // Обрезаем длинные названия, чтобы не налезали друг на друга
        const shortLabel = label.length > 8 ? label.slice(0, 7) + '..' : label;
        ctx.fillText(shortLabel, x + barWidth/2, vHeight - 15);
    });
}


// УВЕДОМЛЕНИЕ 

let uveda = document.querySelector('.uveda');
let count = 1;
let canShowNotification = true; // флаг показа уведомления

// ОБРАБОТЧИК с проверкой флага
document.getElementById('notification').addEventListener('click', () => {
  if (!canShowNotification) return; // НЕ показываем если флаг false
  
  const oldPopup = document.querySelector('.notification-popup');
  if (oldPopup) oldPopup.remove();
  
  // const popup = document.createElement('div');
  // popup.className = 'notification-popup';
  // popup.textContent = 'у вас есть неактивные подписки! исправьте это.';
  // document.getElementById('notification').appendChild(popup);
  
  setTimeout(() => {
    popup.classList.add('show');
    setTimeout(() => {
      popup.classList.remove('show');
      setTimeout(() => popup.remove(), 300);
    }, 4000); 
  }, 100);
});

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('activity-btn')) {
    const activeButton = e.target; 
    
    if (activeButton.classList.contains('active')) {
      console.log('Подписок активно:', count++);
    } else {
      count--
    }
  }

  if(count <= 1){
    uveda.style.display = 'flex';
    canShowNotification = true; // ВКЛЮЧАЕМ уведомление
  } else {
    uveda.style.display = 'none';
    canShowNotification = false; // ОТКЛЮЧАЕМ уведомление
  }
});

//ППЛФОН короче все базовое я сделал, не забудь пж про умное уведомление при скорейшем платеже
//типа буквально if(дата конца подписки+1 = дата сегодняшняя)
// {вылазит то же уведомление чо и выше ток с текстом по типу "завтра будет списание средств по "такойто" подписке"}









