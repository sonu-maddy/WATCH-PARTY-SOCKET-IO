import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket } from '../services/socket';
import  roomStore  from '../store/roomStore';
import VideoPlayer from '../components/VideoPlayer';
import ParticipantList from '../components/ParticipantList';
import ChatBox from '../components/ChatBox'; // Import Chatbox
import Navbar from '../components/Navbar';   // Import Navbar

const Room = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [urlInput, setUrlInput] = useState('');
  const { setStoreData, myRole, videoId, isPlaying } = roomStore();

  useEffect(() => {
    const username = sessionStorage.getItem('username');
    const userId = sessionStorage.getItem('userId');

    if (!username || !userId) {
      navigate('/');
      return;
    }

    socket.emit('join_room', { roomId, username, userId });

    socket.on('sync_state', (data) => {
      setStoreData({
        participants: data.participants || [],
        chat: data.chat || [], // Sync chat log
        videoId: data.videoId,
        isPlaying: data.isPlaying,
        myRole: data.myRole,
        myUserId: data.myUserId
      });
    });

    socket.on('user_joined', (data) => setStoreData({ participants: data.participants || [] }));
    socket.on('user_left', (data) => setStoreData({ participants: data.participants || [] }));

    socket.on('participants_updated', (participants) => {
  setStoreData({ participants });
});
    
    socket.on('role_assigned', (data) => {
      const myUserId = sessionStorage.getItem('userId');
      
      // Pure room ki participants list update karo
      setStoreData({ participants: data.participants || [] });

      // CRITICAL: Agar Vinit ka role badla hai, toh uske browser me 'myRole' state update karo instantly
      const meUpdated = data.participants.find(p => p.userId === myUserId);
      if (meUpdated) {
        setStoreData({ myRole: meUpdated.role });
        console.log("Mera naya role hai:", meUpdated.role);
      }
    });

    socket.on('participant_removed', (data) => setStoreData({ participants: data.participants || [] }));
    socket.on('change_video', (data) => setStoreData({ videoId: data.videoId, isPlaying: true }));
    
    socket.on('kicked', () => {
      alert("You have been removed by the Host.");
      navigate('/');
    });

    return () => {
      socket.off('sync_state');
      socket.off('user_joined');
      socket.off('user_left');
      socket.off('role_assigned');
      socket.off('participant_removed');
      socket.off('participants_updated');
      socket.off('change_video');
      socket.off('kicked');
    };
  }, [roomId, navigate, setStoreData]);

  const handleVideoSubmit = (e) => {
    e.preventDefault();
    if (myRole === 'PARTICIPANT') return alert('Access Denied');
    
    let parsedId = urlInput;
    if (urlInput.includes('v=')) parsedId = urlInput.split('v=')[1].split('&')[0];
    else if (urlInput.includes('youtu.be/')) parsedId = urlInput.split('youtu.be/')[1].split('?')[0];

    socket.emit('change_video', { roomId, videoId: parsedId.trim() });
    setUrlInput('');
  };

  const isAuthorized = myRole === 'HOST' || myRole === 'MODERATOR';

 return (
    <div className="h-screen bg-slate-950 text-white flex flex-col overflow-hidden">
      {/* 1. Global Navigation Bar Component */}
      <Navbar />

      {/* 2. Fixed Dashboard Area */}
      <div className="p-6 max-w-7xl w-full mx-auto grid grid-cols-4 gap-6 flex-1 h-[calc(100vh-73px)] overflow-hidden">
        
        {/* Left Side: Video Window Block */}
        <div className="col-span-3 flex flex-col gap-4 h-full overflow-y-auto pr-1">
          <VideoPlayer roomId={roomId} videoId={videoId} isPlaying={isPlaying} role={myRole} />
          
          {isAuthorized ? (
            <form onSubmit={handleVideoSubmit} className="flex gap-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800 shadow-md">
              <input 
                className="bg-slate-950 border border-slate-800 p-3 rounded-lg flex-1 outline-none text-sm focus:border-blue-500 transition-colors"
                placeholder="Paste YouTube Video URL (e.g. https://www.youtube.com/watch?v=...)"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
              />
              <button className="bg-blue-600 px-6 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors shrink-0">Change Video</button>
            </form>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800/50 text-slate-500 p-3 text-center rounded-xl text-sm">
              🔒 Controls are exclusively restricted to Host/Moderators only.
            </div>
          )}
        </div>

        {/* Right Side: Strict Grid (No Overlap, No Override) */}
        <div className="col-span-1 grid grid-rows-[130px_1fr] gap-3 h-full overflow-hidden">
          
          {/* Active Members: Strictly fixed at 130px height */}
          <div className="overflow-hidden h-full">
            <ParticipantList roomId={roomId} />
          </div>
          
          {/* Chatbox: Strictly takes remaining 1fr (Full Remaining Space) */}
          <div className="overflow-hidden h-full">
            <ChatBox roomId={roomId} />
          </div>

        </div>

      </div>
    </div>
  );
};

export default Room;