import express from "express";
import { Server, Socket } from "socket.io";
import cors from "cors";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const app = express();

// Serve static files from front.end folder
app.use(express.static("front.end"));

const port = 5000;

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/chat")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// User model
const userSchema = new mongoose.Schema({
  userName: String,
  email: String,
  password: String
});

const User = mongoose.model("User", userSchema);

app.use(cors({ origin: "*" }));
app.use(express.json());

// Register endpoint
app.post("/register", async (req, res) => {
  try {
    const { userName, email, password } = req.body;
    if (!userName || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const user = new User({ userName, email, password });
    await user.save();

    res.json({ success: true, message: "User registered successfully" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err });
  }
});

// Login endpoint
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    console.log("DB password:", user.password);
    console.log("Input password:", password);

    if (user.password !== password) {
      return res.status(401).json({ success: false, message: "Wrong password" });
    }

    const token = jwt.sign({ email, userName: user.userName }, "secret");

    res.send({ success: true, data: { access_token: token, userName: user.userName } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err });
  }
});

// Start server
const server = app.listen(port, () => {
  console.log("Server is running on port", port);
});

// Socket.io setup
const io = new Server(server, { cors: { origin: "*" } });





//map [socketId1 => socket1 , socket2=> ];

io.use(async(socket , next)=>{
  const {token}= socket.handshake.auth;
  if(!token){
    return next(new Error ("Authentication Error"));
  }
  const payload  =jwt.verify (token , "secret" ) as any;
  const user =await  User.findOne({email:payload["email"]});
  if(!user){
    return next(new Error("User not found"));
  }
  console.log(user);
  
  socket.data.user = user;
  next();
});
  


io.on("connection", (socket: Socket) => {
  console.log( socket.id);

  // User join event
const Users =io.of('/').sockets;
const onlineUsers =[];
for (const [socketId ,currentSocket] of Users){
  if(socketId ==socket.id) continue;
onlineUsers.push({username:currentSocket.data.user.userName ,socketId})
}
io.emit("users",onlineUsers)
    socket.broadcast.emit("user_connected", socket.data.user);
  });










  // console.log("new user connected");
  // console.log(socket.id);
  // console.log(socket.handshake.auth.token );
  
  // emit >>> FE >> connect
  // io.emit("new user connected", socket.id);//global
  // emit >> events

// io.emit



//io.emit("new user connected", socket.id); // global >> enit to all connected devices



//socket.emit("new user connected", socket.id); // enit to specific device
//socket.broadcast.emit("new user connected", socket.id); 
// emit to all connected devices except sender
//io.to([ds]).emit() >>> emit to specific devices
// 10.except([]).emit() Edin Cat Chat CL
//io.broadcast.emit("new user comcccc.id)
// socket.emit1);





