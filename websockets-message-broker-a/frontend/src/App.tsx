import { useWebSocket } from './hooks';
import { SERVER_PORT } from './constants/environment';

const ROOM_ID = 'abc123';

export const App = () => {
  const { sendMessage } = useWebSocket<any>({
    url: `ws://127.0.0.1:${SERVER_PORT}`,
    initialMessage: { messageType: 'CONNECT', roomId: ROOM_ID },
  });

  return (
    <div>
      Hello{' '}
      <button
        onClick={() =>
          sendMessage({
            messageType: 'SEND',
            roomId: ROOM_ID,
            message: 'Test message from client',
          })
        }
      >
        send message
      </button>
    </div>
  );
};
