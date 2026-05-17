import { roomStore } from '../store/roomStore';
import { socket } from '../services/socket';
import { UserMinus, ShieldAlert } from 'lucide-react';

const ParticipantList = ({ roomId }) => {
  const { participants, myUserId, myRole } = roomStore();

  const changeRole = (targetUserId, currentRole) => {
    const nextRole = currentRole === 'MODERATOR' ? 'PARTICIPANT' : 'MODERATOR';
    socket.emit('assign_role', { roomId, targetUserId, newRole: nextRole });
  };

  const kickUser = (targetUserId, targetName) => {
    if (confirm(`Kya aap ${targetName} ko room se nikalna chahte hain?`)) {
      // CRITICAL: Yahan bhi senderUserId bhejenge
      socket.emit('remove_participant', { 
        roomId, 
        senderUserId: myUserId, 
        targetUserId 
      });
    }
  };

  return (
    <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 text-white h-full flex flex-col overflow-hidden  shadow-xl">
      <h3 className="font-bold text-xs mb-2 border-b border-slate-800 pb-1.5 text-slate-400 uppercase tracking-wider shrink-0">
        👥 Members ({participants.length})
      </h3>
      
      {/* Scrollable member rows */}
      <div className="flex-1 scrollbar-hide overflow-y-auto flex flex-col gap-1 ">
        {participants.map((p) => (
          <div key={p.userId} className="p-1 bg-slate-950 rounded-lg flex justify-between items-center border border-slate-900 shrink-0">
            <div className="flex flex-col min-w-0 flex-1 pr-2">
              <span className={`text-sm truncate font-medium ${p.userId === myUserId ? "text-blue-400 font-bold" : "text-slate-200"}`}>
                {p.username} {p.userId === myUserId && "(You)"}
              </span>
              <span className="text-[10px] text-slate-500 font-mono font-bold">{p.role}</span>
            </div>
            
            {/* Host Controls Section */}
            {myRole === 'HOST' && p.userId !== myUserId && (
              <div className="flex gap-1">
                <button 
                  onClick={() => changeRole(p.userId, p.role)}
                  title={p.role === 'MODERATOR' ? 'Demote to Participant' : 'Promote to Moderator'}
                  className="p-1 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded transition-colors"
                >
                  <ShieldAlert size={14} />
                </button>
                <button 
                  onClick={() => kickUser(p.userId, p.username)}
                  title="Kick from Room"
                  className="p-1 bg-red-950/40 hover:bg-red-900/40 text-red-400 rounded transition-colors border border-red-900/30"
                >
                  <UserMinus size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ParticipantList;