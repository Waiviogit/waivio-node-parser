const WebSocket = require('ws');
const {
  BASE_URL, WS,
} = require('constants/appData').notificationsApi;

const { API_KEY } = process.env;

class SocketClient {
  constructor(url) {
    this.url = url;
    this.ws = new WebSocket(this.url, [], { headers: { API_KEY } });

    this.ws.on('open', () => {
      console.info('socket connection open');
    });

    this.ws.on('error', () => {
      this.ws.close();
    });
  }

  sendMessage(message) {
    if (this.ws.readyState !== 1) {
      this.ws = new WebSocket(this.url, [], { headers: { API_KEY } });
      this.ws.on('error', () => {
        this.ws.close();
      });
      return;
    }
    this.ws.send(message);
  }
}

const socketClient = new SocketClient(`${WS}${BASE_URL}`);

module.exports = {
  socketClient,
};
