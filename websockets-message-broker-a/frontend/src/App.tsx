import { useWebSocket } from './hooks';
import { SERVER_PORT } from './constants/environment';

export const App = () => {
  useWebSocket({
    url: `ws://127.0.0.1:${SERVER_PORT}`,
    initialMessage: { text: 'Hello world' },
  });

  return <div>Hello</div>;
};
