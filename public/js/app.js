import { encryptText, decryptText } from './crypto.js';
import { encodeStego, decodeStego } from './stego.js';

(function main() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/';
    return;
  }

  const socket = io('/', { auth: { token } });

  const roomInput = document.getElementById('room');
  const messageInput = document.getElementById('message');
  const passphraseInput = document.getElementById('passphrase');
  const displayNameInput = document.getElementById('displayName');
  const usersList = document.getElementById('users');
  const messages = document.getElementById('messages');
  const joinBtn = document.getElementById('join');
  const leaveBtn = document.getElementById('leave');
  const sendBtn = document.getElementById('send');
  const fileInput = document.getElementById('image');
  const useStego = document.getElementById('useStego');

  displayNameInput.value = localStorage.getItem('displayName') || '';

  joinBtn.addEventListener('click', () => {
    const room = roomInput.value.trim();
    if (!room) return alert('Enter room');
    socket.emit('join', { room, displayName: displayNameInput.value.trim() || undefined });
    joinBtn.disabled = true;
    leaveBtn.disabled = false;
  });

  leaveBtn.addEventListener('click', () => {
    window.location.reload();
  });

  function addSystem(text) {
    const div = document.createElement('div');
    div.className = 'system';
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function addMessage({ from, content, kind, at }) {
    const item = document.createElement('div');
    item.className = 'message';
    const header = document.createElement('div');
    header.className = 'meta';
    const time = new Date(at).toLocaleTimeString();
    header.textContent = `${from?.displayName || 'Anonymous'} • ${time}`;
    item.appendChild(header);

    if (kind === 'text') {
      const p = document.createElement('p');
      p.textContent = content;
      item.appendChild(p);
    } else if (kind === 'image') {
      const img = document.createElement('img');
      img.className = 'image';
      img.src = content;
      item.appendChild(img);
    }
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
  }

  socket.on('system', (evt) => {
    if (evt.type === 'join') addSystem(`${evt.user} joined`);
    if (evt.type === 'leave') addSystem(`${evt.user} left`);
  });

  socket.on('room_users', ({ users }) => {
    usersList.innerHTML = '';
    users.forEach(u => {
      const li = document.createElement('li');
      li.textContent = u.displayName;
      usersList.appendChild(li);
    });
  });

  socket.on('message', async (msg) => {
    try {
      if (msg.kind === 'text') {
        const passphrase = passphraseInput.value;
        const decrypted = passphrase ? await decryptText(msg.content, passphrase) : msg.content;
        addMessage({ ...msg, content: decrypted });
      } else if (msg.kind === 'image') {
        // Try to decode embedded text if any
        addMessage(msg);
        try {
          const resp = await fetch(msg.content);
          const blob = await resp.blob();
          const extracted = await decodeStego(blob);
          if (extracted) {
            const passphrase = passphraseInput.value;
            const maybe = passphrase ? await decryptText(extracted, passphrase) : extracted;
            addSystem(`Extracted hidden: ${maybe.slice(0, 200)}${maybe.length > 200 ? '…' : ''}`);
          }
        } catch {}
      }
    } catch (err) {
      addSystem('Failed to decrypt message');
    }
  });

  messageInput.addEventListener('input', () => {
    socket.emit('typing', messageInput.value.length > 0);
  });

  socket.on('typing', ({ user, isTyping }) => {
    if (isTyping) {
      addSystem(`${user} is typing…`);
    }
  });

  async function handleSend() {
    const room = roomInput.value.trim();
    if (!room) return alert('Join a room first');
    const passphrase = passphraseInput.value;

    const file = fileInput.files?.[0] || null;
    if (file) {
      // If stego checked, embed the encrypted text message (if any) into the image
      let hiddenText = messageInput.value.trim();
      if (hiddenText) {
        hiddenText = passphrase ? await encryptText(hiddenText, passphrase) : hiddenText;
      }
      const stegoBlob = hiddenText && useStego.checked ? await encodeStego(file, hiddenText) : file;
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(stegoBlob);
      });
      socket.emit('message', { room, kind: 'image', content: dataUrl });
      messageInput.value = '';
      fileInput.value = '';
      return;
    }

    const text = messageInput.value.trim();
    if (!text) return;
    const content = passphrase ? await encryptText(text, passphrase) : text;
    socket.emit('message', { room, kind: 'text', content });
    messageInput.value = '';
  }

  sendBtn.addEventListener('click', () => { handleSend(); });
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSend();
  });

  document.getElementById('logout').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = '/';
  });
})();

