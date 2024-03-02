import { useWebSocket } from './hooks';

export const App = () => {
  useWebSocket({
    url: 'ws://127.0.0.1:8001',
    initialMessage: { text: 'Hello world' },
  });

  return <div>Hello</div>;
};
