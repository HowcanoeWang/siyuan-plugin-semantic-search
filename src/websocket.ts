import { debug } from "./notice";

export function keepConnected() {
    const ws = new WebSocket("ws://localhost:8765");
    // const ws = new WebSocket("ws://localhost:8765/websocket");

    ws.onopen = function(event) {
        debug(`WebSocket is open now. readyState=${ws.readyState}`);
    };
      
    ws.onclose = function(event) {
        debug(`WebSocket disconnected, readyState=${ws.readyState}`);
        setTimeout(keepConnected, 3 * 1000);
    };
    
    ws.onerror= function(error) {
        debug(`WebSocket error: readyState=${ws.readyState}`, error);
    };

    window.sython.ws = ws;
}