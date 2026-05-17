import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const Home = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [joinRoomId, setJoinRoomId] = useState('');

    const generateRoomId = () => {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    };

    const handleCreateRoom = () => {
        if (!username) return alert('Enter username');
        const roomId = generateRoomId();

        // sessionStorage use karenge taaki har tab ka ID alag rahe
        const userId = 'user_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

        sessionStorage.setItem('username', username);
        sessionStorage.setItem('userId', userId);

        navigate(`/room/${roomId}`);
    };

    const handleJoinRoom = () => {
        if (!username || !joinRoomId) return alert('All fields are required');

        const userId = 'user_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

        sessionStorage.setItem('username', username);
        sessionStorage.setItem('userId', userId);

        navigate(`/room/${joinRoomId.trim()}`);
    };

    return (
        <div className='min-h-screen flex items-center justify-center bg-slate-950 text-white'>
            <div className='bg-slate-900 p-10 rounded-3xl w-[500px] border border-slate-800 shadow-2xl'>
                <h1 className='text-4xl font-bold text-center mb-10'>Watch Party</h1>

                <input
                    type='text'
                    placeholder='Enter Username'
                    className='w-full bg-slate-800 p-4 rounded-xl mb-6 outline-none focus:ring-2 focus:ring-blue-500'
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />

                <button
                    onClick={handleCreateRoom}
                    className='w-full bg-blue-600 hover:bg-blue-700 transition-colors p-4 rounded-xl font-bold mb-8'
                >
                    Create Room
                </button>

                <div className='border-t border-slate-700 pt-8'>
                    <input
                        type='text'
                        placeholder='Enter Room ID'
                        className='w-full bg-slate-800 p-4 rounded-xl mb-4 outline-none focus:ring-2 focus:ring-green-500'
                        value={joinRoomId}
                        onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                    />
                    <button
                        onClick={handleJoinRoom}
                        className='w-full bg-green-600 hover:bg-green-700 transition-colors p-4 rounded-xl font-bold'
                    >
                        Join Existing Room
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Home;