const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

let tasks = [];

wss.on('connection', ws => {
    console.log('New client connected');
    // Відправляємо поточні задачі новому клієнту
    ws.send(JSON.stringify({ type: 'load', tasks }));

    ws.on('message', message => {
        const data = JSON.parse(message);

        if (data.type === 'update') {
            tasks = data.tasks;
            // Відправляємо оновлені задачі всім клієнтам
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'update', tasks }));
                }
            });
        } else if (data.type === 'move') {
            // Відправляємо подію пересування всім клієнтам
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'move', from: data.from, to: data.to }));
                }
            });
        } else if (data.type === 'input') {
            // Відправляємо подію введення тексту всім клієнтам
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'input', text: data.text }));
                }
            });
        } else if (data.type === 'clearInput') {
            // Відправляємо подію очищення інпуту всім клієнтам
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'clearInput' }));
                }
            });
        } else if (data.type === 'highlight') {
            // Відправляємо подію підсвічування всім клієнтам
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'highlight', index: data.index }));
                }
            });
        } else if (data.type === 'buttonHighlight') {
            // Відправляємо подію підсвічування кнопки всім клієнтам
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'buttonHighlight', highlight: data.highlight }));
                }
            });
        }
    });

    ws.on('error', error => {
        console.error('WebSocket error:', error);
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

wss.on('error', error => {
    console.error('WebSocket Server error:', error);
});

console.log('WebSocket server is running on ws://localhost:8080');