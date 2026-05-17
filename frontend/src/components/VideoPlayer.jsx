import { useEffect, useRef } from 'react';
import ReactPlayer from 'react-player/youtube';
import { socket } from '../services/socket';
import { roomStore } from '../store/roomStore';

const VideoPlayer = ({ roomId, videoId, isPlaying, role }) => {
  const playerRef = useRef(null);
  const { setStoreData } = roomStore();

  const isAuthorized = role === 'HOST' || role === 'MODERATOR';

  useEffect(() => {
    // 1. Listen for Live Play Event
    socket.on('play', () => {
      console.log("Socket command: Playing video...");
      setStoreData({ isPlaying: true });
    });

    // 2. Listen for Live Pause Event
    socket.on('pause', () => {
      console.log("Socket command: Pausing video...");
      setStoreData({ isPlaying: false });
    });

    // 3. Listen for Live Seek Event
    socket.on('seek', ({ time }) => {
      if (playerRef.current) {
        const currentTime = playerRef.current.getCurrentTime();
        // Infinite loop aur lag se bachne ke liye gap check lagaya hai
        if (Math.abs(currentTime - time) > 2) {
          playerRef.current.seekTo(time, 'seconds');
        }
      }
    });

    return () => {
      socket.off('play');
      socket.off('pause');
      socket.off('seek');
    };
  }, [setStoreData]);

  // Handle local user actions (Sirf Host/Moderator ke liye)
  const handleLocalPlay = () => {
    if (!isAuthorized) return;
    setStoreData({ isPlaying: true });
    socket.emit('play', { roomId });
  };

  const handleLocalPause = () => {
    if (!isAuthorized) return;
    setStoreData({ isPlaying: false });
    socket.emit('pause', { roomId });
  };

  // CRITICAL FIX FOR SEEK: onSeek parameter me current time bhejta hai, use sahi se catch karo
  const handleLocalSeek = (seconds) => {
    if (!isAuthorized) return;
    console.log("Local user seeked to:", seconds);
    socket.emit('seek', { roomId, time: seconds });
  };

  return (
    <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-slate-800 shadow-2xl h-full">
      <ReactPlayer
        ref={playerRef}
        url={`https://www.youtube.com/watch?v=${videoId}`}
        playing={isPlaying}
        controls={true} // FIXED: Sab ke liye hamesha true rakho taaki UI re-render ka glitch na aaye
        width="100%"
        height="100%"
        onPlay={handleLocalPlay}
        onPause={handleLocalPause}
        onBuffer={() => console.log('Buffering...')}
        onSeek={handleLocalSeek} // FIXED: Isme parameter direct second milte hain
        config={{
          youtube: {
            playerVars: { autoplay: 0, rel: 0, disablekb: isAuthorized ? 0 : 1 } // Non-authorized ke liye keyboard shortcuts off
          }
        }}
      />
      
      {/* Overlay to block click/tap: JAISE HI MODERATOR BANEGA YEH LAYER गायब HO JAYEGI */}
      {!isAuthorized && (
        <div 
          className="absolute inset-0 bg-transparent z-10 pointer-events-auto cursor-not-allowed" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            alert("Only Host or Moderator can control the video!");
          }} 
        />
      )}
    </div>
  );
};

export default VideoPlayer;