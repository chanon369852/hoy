class WebSocketService {
  constructor() {
    this.socket = null;
    this.callbacks = {};
  }

  connect() {
    if (!this.socket) {
      this.socket = new WebSocket('ws://localhost:5000');
      
      this.socket.onopen = () => {
        console.log('WebSocket Connected');
      };
      
      this.socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (this.callbacks[data.type]) {
          this.callbacks[data.type](data.payload);
        }
      };
    }
  }

  on(event, callback) {
    this.callbacks[event] = callback;
    return this; // เพื่อให้สามารถ chain ได้
  }

  send(data) {
    if (this.socket) {
      this.socket.send(JSON.stringify(data));
    }
  }
}

export default new WebSocketService();