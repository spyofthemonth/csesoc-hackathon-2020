var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

var letterRequests = [];
// request = {letterId, userIds[] initials, subject, body, replies[]}
// reply = {letterId, userId, initials, body}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.emit("refreshLists", letterRequests);

  socket.on("sendLetter", (userId, letterId, initials, body) => {
    console.log("sent letter:" + body);
    letterRequests.push({userIds: [userId], letterId: letterId, initials: initials, body: body, replies:[]});
    io.emit("refreshLists", letterRequests);
  });

  socket.on("replyLetter", (userId, requestId, replyBody, initials) => {
    console.log("reply to letter:" + requestId);
    let request = letterRequests.find((element) => element.letterId == requestId);
    let replyId = '_' + Math.random().toString(36).substr(2, 9);
    request.userIds.push(userId);
    request.replies.push({letterId: replyId, initials: initials, body: replyBody});
    io.emit("refreshLists", letterRequests);
  });
});

http.listen(process.env.PORT || 8000);