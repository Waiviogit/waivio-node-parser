const WebSocket = require('ws');
const config = require('config');

const { BASE_URL, WS } = config.notificationsApi;

class SocketClient {
  constructor(url) {
    this.url = url;
    this.ws = new WebSocket(this.url, [], { headers: { API_KEY: config.apiKey } });

    this.ws.on('open', () => {
      console.info('socket connection open');
    });

    this.ws.on('error', () => {
      this.ws.close();
    });
  }

  sendMessage(message) {
    if (this.ws.readyState !== 1) {
      this.ws = new WebSocket(this.url, [], { headers: { API_KEY: config.apiKey } });
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
