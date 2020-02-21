let server;

function setServer(io) {
  server = io;
  server.on('connection', () => {
    console.log('\nNew Connection\n');
  });
}

export default {
  get ws() {
    return server;
  },
  setServer
};
