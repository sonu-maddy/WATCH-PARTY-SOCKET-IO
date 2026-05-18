class Participant {
  constructor(socketId, userId, username, role) {
    this.socketId = socketId;
    this.userId = userId;
    this.username = username;
    this.role = role; 
  }
}

module.exports = Participant;