import { useCallback, useMemo } from 'react';

interface UseWebSocketProps<Message> {
  initialMessage: Message;
  url: string;
}

export const useWebSocket = <Message>({
  initialMessage,
  url,
}: UseWebSocketProps<Message>) => {
  const ws = useMemo(() => new WebSocket(url), [url]);

  const sendMessage = useCallback(
    (message: Message) => {
      const messageString = JSON.stringify(message);

      ws.send(messageString);
    },
    [ws],
  );

  ws.onopen = () => {
    if (initialMessage) {
      ws.send(JSON.stringify(initialMessage));
    }
  };

  ws.onmessage = event => {
    console.log('event:', event);
    const json = JSON.parse(event.data);
    console.log('json event:', json);
  };

  return { sendMessage };
};
