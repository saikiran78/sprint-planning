var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var _ = require('lodash');
var process = require('process');

var port = process.env.PORT || 3000;


app.get('/', function (req, res) {
	res.sendFile(__dirname + '/index.html');
});

var clients = [];

io.on('connection', function (socket) {

	console.log(socket.id);

	socket.on('user-login-details', function (userInfo) {
		console.log(userInfo);

		var isHostAvailable = _.find(clients, { 'isHost': true });

		if(userInfo.host && isHostAvailable) {
			socket.emit('host already joined');
			console.log('host already exist');
		} else {

			var client = {
				"id": socket.id,
				"user_name": userInfo.name,
				"isHost": userInfo.host,
				"points": 0
			}
			console.log(client);

			clients.push(client);

			socket.emit('welcome', client);

			socket
				.broadcast
				.emit('new-user-joined', client);

			
			io.emit('participant-list', clients);
			console.log('new user joined');
		}
	});

	

	io.emit('open-login', {for: 'everyone'});

	socket.on('disconnect', function () {
		console.log('user disconnected');
		var user;
		_.remove(clients, function(client) {
			user = client;
			return client.id === socket.id;
		});

		socket
		.broadcast
		.emit('user-left', user);
	});

	socket.on('set-topic', function (topicInfo){

		io.emit('topic', {
			"clients": clients,
			"topic": topicInfo
		});

		io.emit('enable-pointing');
	})

	socket.on('chat message', function (msg) {
		console.log('message: ' + msg);
		io.emit('chat message', msg);
	});

	socket.on('send-points', function (details) {
		console.log(details);
		_.forEach(clients, function(client) {
			if (client.id === details.socket_id) {
				client.points = details.points;
				return;
			}
		});

		io.emit('topic', {
			"clients": clients,
			"topic": {name: details.topic}
		});

		socket.emit('disable-points');
	});

	socket.on('show-points', function(){
		io.emit('show particiapnt points');
	});

	socket.on('reset-topic', function() {
		_.forEach(clients, function(client) {
			client.points = 0;
		})

		io.emit('topic', {
			"clients": clients,
			"topic": null
		});

		io.emit('disable-points');
	});

});

http.listen(port, function () {
	console.log('listening on *:port');
});