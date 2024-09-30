const inputBox = document.getElementById('input-box');
const listContainer = document.getElementById('list-container');
const createButton = document.querySelector('button');

const socket = new WebSocket('ws://localhost:8080');

document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    loadInputText();
});

createButton.addEventListener('click', addTask);

// Ініціалізуємо SortableJS на списку задач
new Sortable(listContainer, {
    animation: 150,
    onEnd: function (evt) {
        saveTasks();
        // Відправляємо подію пересування на сервер
        socket.send(JSON.stringify({ type: 'move', from: evt.oldIndex, to: evt.newIndex }));
    }
});

// Підключення до веб-сокетів
socket.addEventListener('message', event => {
    const data = JSON.parse(event.data);

    if (data.type === 'load' || data.type === 'update') {
        listContainer.innerHTML = '';
        data.tasks.forEach(task => {
            const li = document.createElement('li');
            li.textContent = task.text;
            if (task.checked) {
                li.classList.add('checked');
            }
            listContainer.appendChild(li);

            const span = document.createElement('span');
            span.textContent = '\u00D7';
            li.appendChild(span);
        });
    } else if (data.type === 'move') {
        // Обробка події пересування
        const items = Array.from(listContainer.children);
        const item = items[data.from];
        listContainer.removeChild(item);
        listContainer.insertBefore(item, items[data.to]);
    } else if (data.type === 'input') {
        // Обробка події введення тексту
        inputBox.value = data.text;
    } else if (data.type === 'clearInput') {
        // Обробка події очищення інпуту
        inputBox.value = '';
    } else if (data.type === 'highlight') {
        // Обробка події підсвічування
        const items = Array.from(listContainer.children);
        items.forEach(item => item.classList.remove('highlight'));
        if (data.index !== -1) {
            items[data.index].classList.add('highlight');
        }
    } else if (data.type === 'buttonHighlight') {
        // Обробка події підсвічування кнопки
        if (data.highlight) {
            createButton.classList.add('highlight');
        } else {
            createButton.classList.remove('highlight');
        }
    }
});

// Відправка події введення тексту на сервер
inputBox.addEventListener('input', () => {
    const inputText = inputBox.value;
    localStorage.setItem('inputText', inputText);
    socket.send(JSON.stringify({ type: 'input', text: inputText }));
});

// Функція для створення нової задачі
function addTask() {
    if (inputBox.value === '') {
        alert('Введіть задачу!');
        return;
    }

    const task = {
        text: inputBox.value,
        checked: false
    };

    const li = document.createElement('li');
    li.textContent = task.text;
    listContainer.appendChild(li);

    const span = document.createElement('span');
    span.textContent = '\u00D7';
    li.appendChild(span);

    saveTasks();
    inputBox.value = '';
    localStorage.removeItem('inputText');

    // Відправка події очищення інпуту на сервер
    socket.send(JSON.stringify({ type: 'clearInput' }));
}

// Функція для збереження задач у Local Storage та відправки на сервер
function saveTasks() {
    const tasks = [];
    listContainer.querySelectorAll('li').forEach(li => {
        tasks.push({
            text: li.textContent.slice(0, -1),
            checked: li.classList.contains('checked')
        });
    });
    localStorage.setItem('tasks', JSON.stringify(tasks));
    socket.send(JSON.stringify({ type: 'update', tasks }));
}

// Функція для завантаження задач з Local Storage
function loadTasks() {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks.forEach(task => {
        const li = document.createElement('li');
        li.textContent = task.text;
        if (task.checked) {
            li.classList.add('checked');
        }
        listContainer.appendChild(li);

        const span = document.createElement('span');
        span.textContent = '\u00D7';
        li.appendChild(span);
    });
}

// Функція для завантаження тексту інпуту з Local Storage
function loadInputText() {
    const inputText = localStorage.getItem('inputText');
    if (inputText) {
        inputBox.value = inputText;
    }
}

// Додаємо подію для відмітки задач як виконаних та видалення задач
listContainer.addEventListener('click', function(e) {
    if (e.target.tagName === 'LI') {
        e.target.classList.toggle('checked');
        saveTasks();
    } else if (e.target.tagName === 'SPAN') {
        e.target.parentElement.remove();
        saveTasks();
    }
});

// Додаємо події для підсвічування задач при наведенні курсора
listContainer.addEventListener('mouseover', function(e) {
    if (e.target.tagName === 'LI') {
        const index = Array.from(listContainer.children).indexOf(e.target);
        socket.send(JSON.stringify({ type: 'highlight', index }));
    }
});

listContainer.addEventListener('mouseout', function(e) {
    if (e.target.tagName === 'LI') {
        socket.send(JSON.stringify({ type: 'highlight', index: -1 }));
    }
});

// Додаємо події для підсвічування кнопки при наведенні курсора
createButton.addEventListener('mouseover', function() {
    socket.send(JSON.stringify({ type: 'buttonHighlight', highlight: true }));
});

createButton.addEventListener('mouseout', function() {
    socket.send(JSON.stringify({ type: 'buttonHighlight', highlight: false }));
});