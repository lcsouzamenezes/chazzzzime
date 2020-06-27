import React, { useState, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import styled from 'styled-components';

const W3CWebSocket = require('websocket').w3cwebsocket;
const client = new W3CWebSocket('ws://localhost:1220/', 'echo-protocol');

function App() {
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);
  const [username, setUsername] = useState(false);

  const historyRef = useRef(null);

  const sendMessage = (e) => {
    if (client.readyState === client.OPEN && e.keyCode === 13) {
      client.send(`${message}`);
      setMessage('')
    }
  }

  const handleMessageChange = e => {
    e.preventDefault();
    setMessage(e.target.value);
  }

  client.onerror = () => {
    console.log('Connection Error');
  };
 
  client.onopen = () => {
    setConnected(true)
  };
 
  client.onclose = () => {
    console.log('echo-protocol Client Closed');
  };
  
  client.onmessage = (data) => {
    let json;
    try {
      json = JSON.parse(data.data);
    } catch (e) {
      console.log('This doesn\'t look like a valid JSON: ', data.data);
      return;
    }
    if (json.type === 'color') { // first response from the server with user's color
      setUsername(json)
      console.log('color', json)
    } else if (json.type === 'history') { // entire message history
      setHistory([])
      setHistory(json.data)
    } else if (json.type === 'message') { // it's a single message
      const list = history;
      setHistory([])
      setHistory([...list, json.data])
    } else {
      console.log('Hmm..., I\'ve never seen JSON like this: ', json);
    }
    if (historyRef.current) {
      historyRef.current.scrollTo({
        behavior: "smooth",
        top: historyRef.current.clientHeight * (history.length > 1 ? history.length : 30)
      });
    }
  };

  const user = () => {
    if (!username) return <span>&nbsp;as Guest</span>
    return <span>&nbsp;as <b>{username.data.name}</b></span>
  }

  return (
    <ChatApp className="App">
      <Header color={username ? username.data.color : null}>
        <h1>Chazzzzime</h1>
        <p>
          {connected ? 'Connected ' : 'Wait '}
          {user()}
        </p>
      </Header>
      <HistoryWrap ref={historyRef}>
      {history.map((e, i) => (
        <Item style={{ color: e.color }} key={e.color.toString() + i}>
          <b>{e.author}</b>
          <Message>
            <p>{e.text}</p>
            <sub>{formatDistanceToNow(new Date(e.time))}</sub>
          </Message>
        </Item>
      ))}
      </HistoryWrap>
      <WrapInput>
        <Input
          placeholder={username ? 'your message' : 'enter your name'}
          value={message} onChange={handleMessageChange}
          onKeyDown={sendMessage} />
      </WrapInput>
    </ChatApp>
  );
}

export default App;

const ChatApp = styled.div`
  height: 100vh;
  background: #2f2f2f;
`;

const Header = styled.div`
  height: 60px;
  background: rgba(93, 38, 165, 1);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-direction: row-reverse;
  padding: 0 1rem;
  p {
    display: flex;
    align-items: center;
  }
  p:before {
    content: '';
    margin-right: 1rem;
    width: 15px;
    height: 15px;
    border-radius: 50%;
    border: 3px solid white;
    background-color: ${({color}) => color ? color : 'white'}
  }
`;

const Message = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
`;

const HistoryWrap = styled.div`
  height: calc(100vh - (62px + 2rem) - 60px);
  max-height: calc(100vh - (62px + 2rem) - 60px);
  overflow-y: auto;
  background: rgb(40, 9, 80);
  padding: 1rem;
`;

const Item = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  background: white;
  margin-bottom: 1rem;
  border-radius: 0.25rem;
  padding: 1rem;
`;

const Input = styled.input`
  width: 100%;
  font-size: 1.5rem;
  border: 0;
  border: 1px solid green;
  border-radius: 0.25rem;
  padding: 1rem;
`

const WrapInput = styled.div`
  position: fixed;
  bottom: 0;
  width: 100%;
  padding: 1rem;
  background: rgba(93, 38, 165, 1);
`