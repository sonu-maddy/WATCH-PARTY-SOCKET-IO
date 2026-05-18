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
        // Room naya hai, Sonu HOST banega
        console.log("Creating brand new room in DB...");
        room = new Room({
          roomId,
          participants: [
            { socketId: socket.id, userId, username, role: "HOST" },
          ],
        });
      } else {
        // Phele check karo agar Vinit pehle se array me kisi puraane socketId ke sath tha (Refresh Handle)
        room.participants = room.participants.filter(
          (p) => p.userId !== userId,
        );

        // Check karo agar abhi koi valid HOST baitha hai room me
        const hasHost = room.participants.some((p) => p.role === "HOST");
        const assignedRole = hasHost ? "PARTICIPANT" : "HOST";

        // Vinit ki fresh socket instance entry inject karo
        room.participants.push({
          socketId: socket.id,
          userId,
          username,
          role: assignedRole,
        });
      }

      // MongoDB update commit karo
      await room.save();

      // DB se fresh document verify karo trace clear karne ke liye
      const updatedRoom = await Room.findOne({ roomId });
      const currentParticipant = updatedRoom.participants.find(
        (p) => p.userId === userId,
      );

      console.log(
        `DB Saved successfully. Total members in room now: ${updatedRoom.participants.length}`,
      );

      // 1. PURE ROOM KO UPDATE BHEJO (Toh Sonu ko Vinit dikhega, aur Vinit ko Sonu)
      io.to(roomId).emit("user_joined", {
        username,
        userId,
        role: currentParticipant.role,
        participants: updatedRoom.participants,
      });

      io.to(roomId).emit("participants_updated", updatedRoom.participants);

      // 2. NEW JOINER INDIVIDUAL SYNC
      socket.emit("sync_state", {
        videoId: room.state.videoId,
        isPlaying: room.state.isPlaying,
        currentTime: room.state.currentTime,
        participants: room.participants,
        chat: room.chat || [], // Chat history sync
        myRole: currentParticipant.role,
        myUserId: userId,
      });
    } catch (err) {
      console.error("MongoDB/Socket tracking failed inside join_room:", err);
    }
  });

  // Play video trigger
  socket.on('play', async ({ roomId }) => {
    const room = await Room.findOne({ roomId });
    if (room) {
      const p = room.participants.find(user => user.socketId === socket.id);
      if (p && (p.role === 'HOST' || p.role === 'MODERATOR')) {
        await Room.findOneAndUpdate({ roomId }, { 'state.isPlaying': true });
        // Send to everyone except the host himself
        socket.to(roomId).emit('play');
      }
    }
  });

  // Pause video trigger
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

        // User ko remove karo
        room.participants = room.participants.filter(
          (p) => p.socketId !== socket.id,
        );

        // Agar Host chala gaya hai aur baaki log hain, toh agle bande ko HOST banao
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

 // Open Chat Event (No role validation required)
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

  // 1. PROMOTE / DEMOTE ROLE FUNCTIONALITY (Host Only)
  socket.on('assign_role', async ({ roomId, targetUserId, newRole }) => {
    try {
      console.log(`Role update request in room ${roomId} for user ${targetUserId} to ${newRole}`);
      
      const room = await Room.findOne({ roomId });
      if (!room) return;

      // Request bhejne wale (Sonu) ka role check karo ki kya wo sach me HOST hai
      const assigner = room.participants.find(p => p.socketId === socket.id);
      if (assigner && assigner.role === 'HOST') {
        
        // Target user (Vinit) ko dhundo aur uska role update karo
        const target = room.participants.find(p => p.userId === targetUserId);
        if (target) {
          target.role = newRole;
          await room.save();

          // Poore room ko updated list bhej do taaki UI par role instantly change ho jaye
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

  // 2. KICK PARTICIPANT FUNCTIONALITY (Host Only)
  socket.on('remove_participant', async ({ roomId, senderUserId, targetUserId }) => {
    try {
      const room = await Room.findOne({ roomId });
      if (!room) return;

      // Verify karo ki kya request karne waali userId sach me room ki HOST hai
      const assigner = room.participants.find(p => p.userId === senderUserId);
      
      if (assigner && assigner.role === 'HOST') {
        const target = room.participants.find(p => p.userId === targetUserId);
        if (target) {
          // Us target user ko kick out hone ka signal bhej do
          io.to(target.socketId).emit('kicked');
          
          // Filter out the user from DB array
          room.participants = room.participants.filter(p => p.userId !== targetUserId);
          await room.save();

          // Baaki bache hue members ko state sync karo
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
