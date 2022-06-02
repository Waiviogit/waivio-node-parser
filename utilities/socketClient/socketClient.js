const WebSocket = require('ws');
const {
  BASE_URL, WS,
} = require('constants/appData').notificationsApi;

class SocketClient {
  constructor(url) {
    this.ws = new WebSocket(url);

    this.ws.on('open', () => {
      console.info('socket connection open');
    });

    this.ws.on('close', () => {
      this.ws = new WebSocket(url);
    });

    this.ws.on('error', (data) => {
      console.log(data);
    });
  }

  sendMessage(message) {
    this.ws.send(message);
  }
}

const socketClient = new SocketClient(`${WS}${BASE_URL}`);

module.exports = {
  socketClient,
};
