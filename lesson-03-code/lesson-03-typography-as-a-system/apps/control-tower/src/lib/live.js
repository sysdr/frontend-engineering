// Subscribes to the server's push channel. EventSource reconnects on its
// own; we only report the connection state so the header can say so.
export function connectLive(url, { onSnapshot, onStatus }) {
  const source = new EventSource(url);
  source.addEventListener("open", () => onStatus("live"));
  source.addEventListener("error", () => onStatus("reconnecting"));
  source.addEventListener("tower", (event) => {
    const { reason, data } = JSON.parse(event.data);
    onSnapshot(data, reason);
  });
  return () => source.close();
}
