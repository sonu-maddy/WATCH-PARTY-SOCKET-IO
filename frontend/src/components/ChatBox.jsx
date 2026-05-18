import { useState, useEffect, useRef } from 'react';
import { roomStore } from '../store/roomStore';
import { socket } from '../services/socket';
import { Send } from 'lucide-react';

const ChatBox = ({ roomId }) => {
  const [msgInput, setMsgInput] = useState('');
  const { chat, addChatMessage, myUserId } = roomStore();
  const chatEndRef = useRef(null);

  useEffect(() => {
    socket.on('receive_message', (msg) => {
      addChatMessage(msg);
    });

    return () => {
      socket.off('receive_message');
    };
  }, [addChatMessage]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!msgInput.trim()) return;

    const username = sessionStorage.getItem('username');
    const userId = sessionStorage.getItem('userId');

  
    socket.emit('send_message', {
      roomId,
      text: msgInput.trim(),
      userId,
      username
    });

    setMsgInput('');
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 flex flex-col h-full  text-white overflow-hidden shadow-xl">
      <div className="p-2 border-b border-slate-800 bg-slate-950 font-bold text-sm text-slate-300 shrink-0">
        💬 Live Room Chat
      </div>

      {/* Messages View Area */}
      <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-2 custom-scrollbar">
        {chat.map((msg, index) => {
          const isMe = msg.userId === myUserId;
          return (
            <div key={index} className={`flex flex-col max-w-[85%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
              <span className="text-[10px] text-slate-500 mb-0.5 px-1">{msg.username}</span>
              <div className={`p-1.5 rounded-lg text-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none'}`}>
                <p className="break-all leading-relaxed">{msg.text}</p>
              </div>
              <span className="block text-[8px] text-slate-400 text-right mt-1 font-mono">{msg.time}</span>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

     
      <form onSubmit={handleSendMessage} className="p-2 bg-slate-950 border-t border-slate-800 flex gap-1.5 shrink-0">
        <input 
          type="text"
          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-sm outline-none focus:border-blue-500 transition-colors text-white"
          placeholder="Type a message..."
          value={msgInput}
          onChange={(e) => setMsgInput(e.target.value)}
        />
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 p-2 rounded-lg transition-colors text-white shrink-0">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default ChatBox;