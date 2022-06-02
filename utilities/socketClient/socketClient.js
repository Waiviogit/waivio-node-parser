const WebSocket = require('ws');
const {
  BASE_URL, WS,
} = require('constants/appData').notificationsApi;

class SocketClient {
  constructor(url) {
    this.url = url;
    this.ws = new WebSocket(url);

    this.ws.on('open', () => {
      console.info('socket connection open');
    });

    this.ws.on('close', () => {
      this.ws = new WebSocket(url);
    });
  }

  sendMessage(message) {
    if (this.ws.readyState !== 1) {
      this.ws = new WebSocket(this.url);
      return;
    }
    this.ws.send(message);
  }
}

const socketClient = new SocketClient(`${WS}${BASE_URL}`);

module.exports = {
  socketClient,
};
