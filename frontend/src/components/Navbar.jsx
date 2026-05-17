import { useNavigate, useParams } from 'react-router-dom';
import { Tv, LogOut, Copy } from 'lucide-react';

const Navbar = () => {
    const navigate = useNavigate();
    const { roomId } = useParams();
    const username = sessionStorage.getItem('username');

    const handleLeave = () => {
        if (confirm("Are you sure you want to leave the party?")) {
            sessionStorage.clear();
            window.location.href = "/";
        }
    };

    const copyRoomLink = () => {
        // URL ko '/' se split karke aakhiri part (Room ID) nikalna
        const currentUrl = window.location.href;
        const extractedRoomId = currentUrl.substring(currentUrl.lastIndexOf('/') + 1);

        navigator.clipboard.writeText(extractedRoomId.trim())
            .then(() => {
                alert("Watch Party Room ID copied to clipboard! 🍿");
            })
            .catch(() => {
                alert("Failed to copy Room ID. Please try manually.");
            });
    };

    return (
        <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 py-2 sticky top-0 z-50 flex justify-between items-center text-white">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                <Tv className="text-blue-500 w-6 h-6 animate-pulse" />
                <span className="font-extrabold text-xl tracking-wider bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                    WATCHPARTY
                </span>
            </div>

            {roomId && (
                <div className="flex items-center gap-4">
                    <div className="bg-slate-950 px-4 py-1.5 rounded-full border border-slate-800 text-sm flex items-center gap-2">
                        <span className="text-slate-400">Room:</span>
                        <span className="font-mono text-blue-400 font-bold tracking-wide">{roomId}</span>
                        <button onClick={copyRoomLink} title="Copy Invite Link" className="text-slate-400 hover:text-white ml-1">
                            <Copy size={14} />
                        </button>
                    </div>

                    <div className="text-sm bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
                        🎭 <span className="text-slate-300 font-medium">{username}</span>
                    </div>

                    <button
                        onClick={handleLeave}
                        className="flex items-center gap-1.5 bg-red-950/40 text-red-400 hover:bg-red-900/40 border border-red-900/50 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                    >
                        <LogOut size={15} /> Leave
                    </button>
                </div>
            )}
        </nav>
    );
};

export default Navbar;