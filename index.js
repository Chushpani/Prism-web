const loginOverlay = document.getElementById('login-overlay');
  const registerOverlay = document.getElementById('register-overlay');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const openRegisterBtn = document.getElementById('open-register');
  let profile = ' ';

  // Переключение на регистрацию
  openRegisterBtn.addEventListener('click', () => {
    loginOverlay.style.display = 'none';
    registerOverlay.style.display = 'flex';
  });

  // Логин: закрываем только после успешной валидации
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (loginForm.checkValidity()) {
      profile = loginForm.querySelector('input[type="email"]').value;
      document.getElementById('name').innerHTML = profile;
      // fetch('/api/login', { method: 'POST', body: new FormData(loginForm) })
      // .then(() => { /* токен получен */ })
      
      loginOverlay.style.display = 'none';  // закрываем
      document.documentElement.style.overflow = 'auto';
      document.body.style.overflow = 'auto';
    } else {
      loginForm.reportValidity();
    }
  });

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
  renderAnalytics('service');
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
    renderAnalytics(btn.dataset.view);
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

function renderAnalytics(view) {
  const subs = getSubscriptions();
  const chartContainer = document.getElementById('chart-container');
  const statsContainer = document.getElementById('summary-stats');
  
  let data = {};
  let title = '';
  
  if (view === 'service') {
    // Группировка по сервисам
    subs.forEach(sub => {
      data[sub.name] = (data[sub.name] || 0) + sub.price;
    });
    title = 'Затраты по сервисам';
  } else {
    // Группировка по активности
    const activeSum = subs.filter(s => s.active).reduce((sum, s) => sum + s.price, 0);
    const inactiveSum = subs.filter(s => !s.active).reduce((sum, s) => sum + s.price, 0);
    data = { 'Активные': activeSum, 'Неактивные': inactiveSum };
    title = 'Активность подписок';
  }
  
  // Столбиковая диаграмма (узкие столбики)
  chartContainer.innerHTML = `<canvas id="analytics-chart" width="600" height="250"></canvas>`;
  drawBarChart(document.getElementById('analytics-chart'), Object.entries(data), title);
  
  // Сводка
  const total = subs.reduce((sum, s) => sum + s.price, 0);
  const activeCount = subs.filter(s => s.active).length;
  statsContainer.innerHTML = `
    <div style="display: flex; gap: 20px; margin: 20px 0;">
      <div style="background: #1e293b; padding: 16px; border-radius: 8px;">
        <h3>${total} ₽</h3>
        <p>Всего затрат</p>
      </div>
      <div style="background: #1e293b; padding: 16px; border-radius: 8px;">
        <h3>${activeCount} / ${subs.length}</h3>
        <p>активных</p>
      </div>
    </div>
  `;
}

function drawBarChart(canvas, data, title) {
  const ctx = canvas.getContext('2d');
  const barWidth = 35; // узкие столбики
  const padding = 60;
  const maxValue = Math.max(...data.map(d => d[1]));
  
  // Фон
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Заголовок
  ctx.fillStyle = 'white';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, canvas.width / 2, 25);
  
  data.forEach(([label, value], i) => {
    const barHeight = (value / maxValue) * 180;
    const x = i * 50 + padding;
    const y = canvas.height - barHeight - 40;
    
    // Столбик
    const hue = i * 60;
    ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
    ctx.fillRect(x, y, barWidth, barHeight);
    
    // Значение
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${value}₽`, x + barWidth/2, y - 10);
    
    // Подпись
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.fillText(label.slice(0, 10), x + barWidth/2, canvas.height - 10);
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
  
  const popup = document.createElement('div');
  popup.className = 'notification-popup';
  popup.textContent = 'у вас есть неактивные подписки! исправьте это.';
  document.getElementById('notification').appendChild(popup);
  
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











