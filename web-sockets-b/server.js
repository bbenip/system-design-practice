import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', function connection(ws) {
  console.log('server is connected to a client');

  ws.on('error', console.error);

  ws.on('message', function message(data) {
    console.log(`received: ${data}`);
  });
});
