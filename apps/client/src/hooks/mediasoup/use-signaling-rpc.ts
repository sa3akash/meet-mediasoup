import { useRef, useCallback } from "react";

export function useSignalingRpc(wsRef: React.RefObject<WebSocket | null>) {
  const pendingRequests = useRef<Map<string, { resolve: Function; reject: Function }>>(new Map());

  const sendRequest = useCallback((method: string, data: any = {}): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        return reject(new Error("WebSocket not open"));
      }
      const id = crypto.randomUUID();
      pendingRequests.current.set(id, { resolve, reject });
      wsRef.current.send(JSON.stringify({ id, method, data }));
    });
  }, [wsRef]);

  const handleRpcResponse = useCallback((msg: any) => {
    if (msg.id && pendingRequests.current.has(msg.id)) {
      const { resolve, reject } = pendingRequests.current.get(msg.id)!;
      pendingRequests.current.delete(msg.id);
      if (msg.ok) resolve(msg.data);
      else reject(new Error(msg.error?.message || "RPC Error"));
      return true;
    }
    return false;
  }, []);

  return { sendRequest, handleRpcResponse };
}
