const WebSocketServer = require('websocket').server
const http = require('http');

const PORT = 1220;

/**
 * Global variables
 */
// latest 100 messages
let history = [ ];
// list of currently connected clients (users)
let clients = [ ];
const colors = [ 'red', 'green', 'blue', 'magenta', 'purple', 'plum', 'orange' ];
// ... in random order
colors.sort(() => Math.random() > 0.5 );

const server = http.createServer((request, response) => {
  console.log((new Date()) + ' Received request for ' + request.url);
  response.writeHead(404);
  response.end();
});
server.listen(PORT, () => {
  console.log((new Date()) + ' Server is listening on port ' + PORT);
});

const wsServer = new WebSocketServer({
  httpServer: server,
  // You should not use autoAcceptConnections for production
  // applications, as it defeats all standard cross-origin protection
  // facilities built into the protocol and the browser.  You should
  // *always* verify the connection's origin and decide whether or not
  // to accept it.
  autoAcceptConnections: false
});

 
function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}
 
wsServer.on('request', request => {
  if (!originIsAllowed(request.origin)) {
    // Make sure we only accept requests from an allowed origin
    request.reject();
    console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
    return;
  }
  
  const connection = request.accept('echo-protocol', request.origin);
  const index = clients.push(connection) - 1;
  let userName = false;
  let userColor = false;

  console.log(connection)

  // send back chat history
  if (history.length > 0) {
    connection.sendUTF(JSON.stringify( { type: 'history', data: history} ));
  }

  console.log((new Date()) + ' Connection accepted.');
  connection.on('message', message => {
    if (message.type === 'utf8') {
      // console.log('Received Message: ' + message.utf8Data);
      // connection.sendUTF(message.utf8Data);
      if (userName === false) { // first message sent by user is their name
        // remember user name
        userName = message.utf8Data;
        // get random color and send it back to the user
        userColor = colors.shift();
        connection.sendUTF(JSON.stringify({ type:'color', data: { color: userColor, name: userName } }));
        console.log((new Date()) + ' User is known as: ' + userName + ' with ' + userColor + ' color.');

      } else { // log and broadcast the message
        console.log((new Date()) + ' Received Message from ' + userName + ': ' + message.utf8Data);
        
        // we want to keep history of all sent messages
        const obj = {
          time: (new Date()).getTime(),
          text: message.utf8Data,
          author: userName,
          color: userColor
        };
        history.push(obj);
        history = history.slice(-100);

        // broadcast message to all connected clients
        const json = JSON.stringify({ type:'message', data: obj });
        for (var i=0; i < clients.length; i++) {
          clients[i].sendUTF(json);
        }
      }
    }
    else if (message.type === 'binary') {
      console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
      connection.sendBytes(message.binaryData);
    }
  });
  connection.on('close', (reasonCode, description) => {
    if (userName !== false && userColor !== false) {
      console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
      // remove user from the list of connected clients
      clients.splice(index, 1);
      // push back user's color to be reused by another user
      colors.push(userColor);
    }
  });
});