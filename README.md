# 🎬 Watch Party App

A real-time Watch Party platform where users can create rooms, watch YouTube videos together, sync playback, chat live, and manage participants with role-based controls.

---

## 🚀 Live Demo

### 🌐 Frontend

https://watch-party-socket-io.netlify.app

### ⚡ Backend API

https://watch-party-socket-io.onrender.com

---

# ✨ Features

* 🔥 Real-time video synchronization
* 👥 Create & join watch rooms
* 💬 Live group chat
* 🎭 Host / Moderator / Participant roles
* ⏯️ Play / Pause / Seek sync
* 📺 Change YouTube video in real-time
* 🚫 Kick participants
* 🧠 MongoDB room persistence
* ⚡ Socket.io powered communication
* 📱 Responsive UI

---

# 🛠️ Tech Stack

## Frontend

* React.js
* Vite
* Tailwind CSS
* Zustand
* Socket.io Client

## Backend

* Node.js
* Express.js
* Socket.io
* MongoDB Atlas
* Mongoose

## Deployment

* Netlify (Frontend)
* Render (Backend)

---

# 📂 Project Structure

```bash
watch-party-app/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── src/
│   ├── models/
│   └── package.json
│
└── README.md
```

---

# ⚙️ Environment Variables

## Frontend `.env`

```env
VITE_BACKEND_URL=https://watch-party-socket-io.onrender.com
```

---

## Backend `.env`

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
CLIENT_URL=https://watch-party-socket-io.netlify.app
```

---

# 🧑‍💻 Installation & Setup

## 1️⃣ Clone Repository

```bash
git clone https://github.com/sonu-maddy/WATCH-PARTY-SOCKET-IO.git
```

---

# 🔹 Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

```bash
http://localhost:5173
```

---

# 🔹 Backend Setup

```bash
cd backend
npm install
npm run dev
```

Backend runs on:

```bash
http://localhost:5000
```

---

# 🌍 Deployment

## Frontend Deployment

Hosted on Netlify.

Build Command:

```bash
npm run build
```

Publish Directory:

```bash
dist
```

---

## Backend Deployment

Hosted on Render.

Start Command:

```bash
npm start
```

Build Command:

```bash
npm install
```

---

# 📡 Socket Events

| Event              | Description      |
| ------------------ | ---------------- |
| join_room          | Join/Create room |
| play               | Sync video play  |
| pause              | Sync video pause |
| seek               | Sync video seek  |
| change_video       | Change video     |
| send_message       | Live chat        |
| assign_role        | Promote/Demote   |
| remove_participant | Kick participant |

---





# 🔐 Role Permissions

| Role        | Permissions       |
| ----------- | ----------------- |
| HOST        | Full control      |
| MODERATOR   | Video controls    |
| PARTICIPANT | Watch & Chat only |

---

# 📈 Future Improvements

* 🎥 WebRTC video/audio call
* 🔔 Notifications
* 📜 Watch history
* 🔐 Authentication
* 🧑‍🤝‍🧑 Friend system
* 🎞️ Playlist support

---

# 👨‍💻 Author

## Sonu Maddheshiya

Full Stack Developer

GitHub:
https://github.com/sonu-maddy

---

# ⭐ Support

If you like this project, give it a ⭐ on GitHub.

