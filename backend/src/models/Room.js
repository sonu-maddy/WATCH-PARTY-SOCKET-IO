const mongoose = require('mongoose');

const ParticipantSchema = new mongoose.Schema({
  socketId: { type: String, required: true },
  userId: { type: String, required: true },
  username: { type: String, required: true },
  role: { type: String, enum: ['HOST', 'MODERATOR', 'PARTICIPANT'], default: 'PARTICIPANT' }
});

// Chat message structure
const MessageSchema = new mongoose.Schema({
  username: { type: String, required: true },
  userId: { type: String, required: true },
  text: { type: String, required: true },
  time: { type: String, required: true }
});

const RoomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  state: {
    videoId: { type: String, default: 'dQw4w9WgXcQ' },
    isPlaying: { type: Boolean, default: false },
    currentTime: { type: Number, default: 0 }
  },
  participants: [ParticipantSchema],
  chat: [MessageSchema] // Chat storage added
}, { timestamps: true });

module.exports = mongoose.model('Room', RoomSchema);