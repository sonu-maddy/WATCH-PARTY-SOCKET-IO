const Room = require("../models/Room");

function registerSocketEvents(io, socket) {
  socket.on("join_room", async ({ roomId, username, userId }) => {
    try {
      console.log(
        `Backend parsing join request for: Room=${roomId}, User=${username}, ID=${userId}`,
      );

      if (!roomId || !username || !userId) {
        console.error("Aborting: Payload elements missing!");
        return;
      }

      socket.join(roomId);
      let room = await Room.findOne({ roomId });

      if (!room) {
        
        console.log("Creating brand new room in DB...");
        room = new Room({
          roomId,
          participants: [
            { socketId: socket.id, userId, username, role: "HOST" },
          ],
        });
      } else {

        room.participants = room.participants.filter(
          (p) => p.userId !== userId,
        );


        const hasHost = room.participants.some((p) => p.role === "HOST");
        const assignedRole = hasHost ? "PARTICIPANT" : "HOST";

  
        room.participants.push({
          socketId: socket.id,
          userId,
          username,
          role: assignedRole,
        });
      }


      await room.save();

 
      const updatedRoom = await Room.findOne({ roomId });
      const currentParticipant = updatedRoom.participants.find(
        (p) => p.userId === userId,
      );

      console.log(
        `DB Saved successfully. Total members in room now: ${updatedRoom.participants.length}`,
      );

   
      io.to(roomId).emit("user_joined", {
        username,
        userId,
        role: currentParticipant.role,
        participants: updatedRoom.participants,
      });

      io.to(roomId).emit("participants_updated", updatedRoom.participants);

 
      socket.emit("sync_state", {
        videoId: room.state.videoId,
        isPlaying: room.state.isPlaying,
        currentTime: room.state.currentTime,
        participants: room.participants,
        chat: room.chat || [], 
        myRole: currentParticipant.role,
        myUserId: userId,
      });
    } catch (err) {
      console.error("MongoDB/Socket tracking failed inside join_room:", err);
    }
  });


  socket.on('play', async ({ roomId }) => {
    const room = await Room.findOne({ roomId });
    if (room) {
      const p = room.participants.find(user => user.socketId === socket.id);
      if (p && (p.role === 'HOST' || p.role === 'MODERATOR')) {
        await Room.findOneAndUpdate({ roomId }, { 'state.isPlaying': true });

        socket.to(roomId).emit('play');
      }
    }
  });

  
  socket.on('pause', async ({ roomId }) => {
    const room = await Room.findOne({ roomId });
    if (room) {
      const p = room.participants.find(user => user.socketId === socket.id);
      if (p && (p.role === 'HOST' || p.role === 'MODERATOR')) {
        await Room.findOneAndUpdate({ roomId }, { 'state.isPlaying': false });
        // Send to everyone except the host himself
        socket.to(roomId).emit('pause');
      }
    }
  });

  socket.on("seek", async ({ roomId, time }) => {
    const room = await Room.findOne({ roomId });
    if (room) {
      const p = room.participants.find((user) => user.socketId === socket.id);
      if (p && (p.role === "HOST" || p.role === "MODERATOR")) {
        await Room.findOneAndUpdate({ roomId }, { "state.currentTime": time });
        socket.to(roomId).emit("seek", { time });
      }
    }
  });

  socket.on("change_video", async ({ roomId, videoId }) => {
    const room = await Room.findOne({ roomId });
    if (room) {
      const p = room.participants.find((user) => user.socketId === socket.id);
      if (p && (p.role === "HOST" || p.role === "MODERATOR")) {
        await Room.findOneAndUpdate(
          { roomId },
          {
            "state.videoId": videoId,
            "state.currentTime": 0,
            "state.isPlaying": true,
          },
        );
        io.to(roomId).emit("change_video", { videoId });
      }
    }
  });
  socket.on("disconnect", () => {
    setTimeout(async () => {
      const rooms = await Room.find({ "participants.socketId": socket.id });
      for (let room of rooms) {
        const leftUser = room.participants.find(
          (p) => p.socketId === socket.id,
        );
        if (!leftUser) continue;

       
        room.participants = room.participants.filter(
          (p) => p.socketId !== socket.id,
        );

      
        if (leftUser.role === "HOST" && room.participants.length > 0) {
          room.participants[0].role = "HOST";
        }

        if (room.participants.length === 0) {
          await Room.deleteOne({ roomId: room.roomId });
        } else {
          await room.save();
          io.to(room.roomId).emit("user_left", {
            participants: room.participants,
          });

          io.to(room.roomId).emit(
  "participants_updated",
  room.participants
);
        }
      }
    }, 2000);
  });

 
  socket.on('send_message', async ({ roomId, text, userId, username }) => {
    try {
      const room = await Room.findOne({ roomId });
      if (!room) return;

      const newMessage = {
        username,
        userId,
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      room.chat.push(newMessage);
      await room.save();

      // Pura room (Host + Moderators + Participants) ko instantly message broadcast hoga
      io.to(roomId).emit('receive_message', newMessage);
    } catch (err) {
      console.error("Chat backend error:", err);
    }
  });

  
  socket.on('assign_role', async ({ roomId, targetUserId, newRole }) => {
    try {
      console.log(`Role update request in room ${roomId} for user ${targetUserId} to ${newRole}`);
      
      const room = await Room.findOne({ roomId });
      if (!room) return;

      /
      const assigner = room.participants.find(p => p.socketId === socket.id);
      if (assigner && assigner.role === 'HOST') {
        
       
        const target = room.participants.find(p => p.userId === targetUserId);
        if (target) {
          target.role = newRole;
          await room.save();

         
          io.to(roomId).emit('role_assigned', {
            userId: targetUserId,
            username: target.username,
            role: newRole,
            participants: room.participants
          });
          
          console.log(`Successfully updated ${target.username} to ${newRole}`);
        }
      } else {
        console.log("Unauthorized attempt to change role!");
      }
    } catch (err) {
      console.error("Error in assign_role:", err);
    }
  });

 
  socket.on('remove_participant', async ({ roomId, senderUserId, targetUserId }) => {
    try {
      const room = await Room.findOne({ roomId });
      if (!room) return;

      /
      const assigner = room.participants.find(p => p.userId === senderUserId);
      
      if (assigner && assigner.role === 'HOST') {
        const target = room.participants.find(p => p.userId === targetUserId);
        if (target) {
         
          io.to(target.socketId).emit('kicked');
          
         
          room.participants = room.participants.filter(p => p.userId !== targetUserId);
          await room.save();

         
          io.to(roomId).emit('participant_removed', {
            participants: room.participants
          });
          console.log(`[SUCCESS] Kicked user ${target.username} successfully.`);
        }
      } else {
        console.log(`[DENIED] Unauthorized kick attempt by userId: ${senderUserId}`);
      }
    } catch (err) {
      console.error("Backend remove_participant error:", err);
    }
  });
}

module.exports = registerSocketEvents;
