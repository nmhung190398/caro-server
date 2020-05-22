var express = require("express");
var app = express();
var bodyParser = require("body-parser");
app.use(bodyParser.json());
var http = require("http").Server(app);
var io = require("socket.io")(http);
var ent = require("ent"); // Blocks HTML characters (security equivalent to htmlentities in PHP)
var mysql = require("mysql"); // include thêm module mysql
const mongoose = require("mongoose");
const userSchema = require("./model/user.schema");
let userModel = null;

async function connectionDB() {
  await mongoose.connect(MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  });

  userModel = mongoose.model("user", userSchema);
}

const dpHost = "127.0.0.1";
const dbPort = "27017";
const dbName = "caro";
const MONGO_URL = `mongodb://${dpHost}:${dbPort}/${dbName}`;

connectionDB();

app.get("/user", function (req, res) {});

app.post("/user", async (req, res) => {
  console.log("Got body:", req.body);
  const username = req.body.username;
  const password = req.body.password;

  if (username == null || password == null) {
    res.status(404).json("dữ liệu đầu vào không đúng");
  }

  if (await userModel.exists({ username: username })) {
    res.status(300).json("tài khoản đã tồn tại");
  } else {
    await userModel.create({
      username: username,
      password: password,
    });
    res.status(200).json("tạo tài khoản thành công");
  }
});

app.post("/login", async (req, res) => {
  console.log("login");
  const username = req.query.username;
  const password = req.query.password;
  if (username == null || password == null) {
    res.status(404).json("dữ liệu đầu vào không đúng");
  }
  if (
    await userModel.exists({
      username: username,
      password: password,
    })
  ) {
    res.status(200).json("Đănh nhập thành công");
  } else {
    res.status(300).json("sai mật khẩu hoặc tài khoản");
  }
});

app.get("/test", (req, res) => {
  console.log("test");
  res.status(200).json("test");
});

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.get("/error", function (req, res) {
  res.sendFile(__dirname + "/error.html");
});
var allClients = [];
io.on("connection", (socket, username) => {
  allClients.push(socket);
  // socket.emit("clients", allClients.length);

  socket.on("disconnect", () => {
    console.log("Got disconnect!");
    var i = allClients.indexOf(socket);
    allClients.splice(i, 1);
    socket.emit("clients", allClients.length);
  });

  // When the username is received it’s stored as a session variable and informs the other people

  socket.on("attack", (data) => {
    console.log(data);
    io.emit("attack", data);
    // socket.to(data.roomId).emit("attack", data);
  });

  socket.on("waitingRoom", (data) => {
    console.log(data);
    socket.emit("rooms", io.sockets.adapter.rooms);
  });

  socket.on("joinRoom", (roomId) => {
    console.log("room id " + roomId);
    if (socket.adapter.rooms[roomId]) {
      if (socket.adapter.rooms[roomId].length >= 2) {
        socket.emit("joinRoom", {
          status: false,
          msg: "phòng đầy",
        });
        return;
      }
    }
    socket.join(roomId);
    //validate lengt socket in room
    socket.emit("joinRoom", {
      status: true,
      msg: "Vào phòng thành công",
      roomId: roomId,
    });
    io.emit("rooms", io.sockets.adapter.rooms);
  });

  socket.on("leaveRoom", (roomId) => {
    console.log("leaveRoom - " + roomId);
    socket.leave(roomId);
    io.emit("rooms", io.sockets.adapter.rooms);
  });
});

http.listen(3000, function () {
  console.log("listening on *:3000");
});

//var app = require('express')(),
//    server = require('http').createServer(app),
//    io = require('socket.io').listen(server),
//    ent = require('ent'), // Blocks HTML characters (security equivalent to htmlentities in PHP)
//    fs = require('fs');
//
//// Loading the page index.html
//app.get('/', function (req, res) {
//  res.sendfile(__dirname + '/index.html');
//});

//io.sockets.on('connection', function (socket, username) {
//    // When the username is received it’s stored as a session variable and informs the other people
//    socket.on('new_client', function(username) {
//        username = ent.encode(username);
//        socket.username = username;
//        socket.broadcast.emit('new_client', username);
//    });
//
//    // When a message is received, the client’s username is retrieved and sent to the other people
//    socket.on('message', function (message) {
//        message = ent.encode(message);
//        socket.broadcast.emit('message', {username: socket.username, message: message});
//    });
//});
