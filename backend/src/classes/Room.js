const Participant = require('./Participant');

class Room {
  constructor(roomId) {
    this.roomId = roomId;
    this.participants = new Map();
    this.state = {
      videoId: 'dQw4w9WgXcQ', // Default video
      isPlaying: false,
      currentTime: 0
    };
  }

  addParticipant(socketId, userId, username) {
    // First user becomes HOST automatically
    const role = this.participants.size === 0 ? 'HOST' : 'PARTICIPANT';
    const participant = new Participant(socketId, userId, username, role);
    this.participants.set(socketId, participant);
    return participant;
  }

  removeParticipant(socketId) {
    const participant = this.participants.get(socketId);
    this.participants.delete(socketId);
    
    // If Host leaves, transfer host to another user if available
    if (participant && participant.role === 'HOST' && this.participants.size > 0) {
      const nextUser = this.participants.values().next().value;
      nextUser.role = 'HOST';
    }
    return participant;
  }

  getParticipantsList() {
    return Array.from(this.participants.values());
  }

  hasPermission(socketId) {
    const p = this.participants.get(socketId);
    return p && (p.role === 'HOST' || p.role === 'MODERATOR');
  }
}

module.exports = Room;