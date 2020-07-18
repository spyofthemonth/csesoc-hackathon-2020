var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

var letterRequests = [];
// request = {dateSent, letterId, userIds[] initials, subject, body, replies{userId: []}}
// reply = {dateSent, requestId, letterId, userId, initials, subject, body}
var requestsByUser = {};
var repliesByUser = {};

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.emit("refreshLists", letterRequests);

  socket.on("sendLetter", (userId, initials, subject, body) => {
    console.log("sent letter:" + body);
    let letterId = '_' + Math.random().toString(36).substr(2, 9);
    let currDate = new Date().toJSON().slice(0,10).replace(/-/g,'/');
    let letterObj = {
      dateSent: currDate,
      userIds: [userId],
      letterId: letterId,
      initials: initials,
      subject: subject,
      body: body,
      replies: {}
    };
    letterRequests.push(letterObj);
    if (userId in requestsByUser) {
      requestsByUser[userId].push(letterObj);
    } else {
      requestsByUser[userId] = [letterObj];
    }
    io.emit("refreshLists", letterRequests);
  });

  socket.on("replyLetter", (requestId, userId, initials, replySubject, replyBody) => {
    console.log("reply to letter:" + requestId);
    let request = letterRequests.find((element) => element.letterId == requestId);
    let replyId = '_' + Math.random().toString(36).substr(2, 9);
    let currDate = new Date().toJSON().slice(0,10).replace(/-/g,'/');
    request.userIds.push(userId);
    let replyObj = {
      dateSent: currDate,
      requestId: requestId,
      letterId: replyId,
      userId: userId,
      initials: initials,
      subject: replySubject,
      body: replyBody
    };
    //request.replies.push(replyObj);
    if (userId in request.replies) {
      request.replies[userId].push(replyObj);
    } else {
      request.replies[userId] = [replyObj];
    }
    if (userId in repliesByUser) {
      repliesByUser[userId].push(replyObj);
    } else {
      repliesByUser[userId] = [replyObj];
    }
    io.emit("refreshLists", letterRequests);
  });

  socket.on("getRequests", () => {
    socket.emit("receiveRequests", letterRequests);
  });

  socket.on("getUserLetters", (userId) => {
    socket.emit("receiveUserLetters", requestsByUser[userId]);
  });

  socket.on("getUserResponses", (userId) => {
    socket.emit("receiveUserResponses", repliesByUser[userId]);
  });

  socket.on("getThread", (isResponse, letterId, userId) => {
    let thread = [];
    if (isResponse) {
      let reply = repliesByUser[userId].find((element) => element.letterId == letterId);
      thread.push(letterRequests.find((element) => element.letterId == reply.requestId));
    } else {
      thread.push(letterRequests.find((element) => element.letterId == letterId));
    }
    if (thread[0].replies[userId] != undefined) {
      thread = thread.concat(thread[0].replies[userId]);
    }
    socket.emit("receiveThread", thread);
  });
});

http.listen(process.env.PORT || 8000);