var userId = undefined;
var roomCode = undefined;
const roomError = document.getElementById('room_errors');
var socket = io();
var player1_animation = false;
var player2_animation = false;

function	updatePlayers(response) {
	const player1 = document.getElementById('player1_name');
	const player2 = document.getElementById('player2_name');
	if (response['player_1'] !== null && response['player_1']['stats'] !== null) {
		// player1_animation = false;
		player1.textContent = 'Player 1: ' + response['player_1']['username'] + ' (' + response['player_1']['stats']['elo'] + ')';
	}
	else {
		// player1_animation = true;
		player1.textContent = 'Player 1: Waiting for someone to join.'
		// animateDots(document.getElementById('player1_name'), 1);
	}
	if (response['player_2'] !== null && response['player_2']['stats'] !== null) {
		// player2_animation = false;
		player2.textContent = 'Player 2: ' + response['player_2']['username'] + ' (' + response['player_2']['stats']['elo'] + ')';
	}
	else {
		// animateDots(document.getElementById('player2_name'), 2);
		// player2_animation = true;
		player2.textContent = 'Player 2: Waiting for someone to join.'
	}
}

socket.on("user_joined", function(data) {
	console.log(data);
	updatePlayers(data);
})

socket.on("user_left", function(data) {
	console.log('RECEIVED UPDATE');
	console.log(data);
	updatePlayers(data);
})

async function	get_room(roomCode){
	return fetch(`/get_room?roomCode=${roomCode}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({userId})
		})
	.then(response => {
		console.log(response);
		if (!response.ok) {
			throw new Error('Error getting room');
		}
		return response.json();
	})
	.then(data => {
		console.log(data);
		return (data);
	})
	.catch(error => {
		console.error(error);
	});	
}

function	get_stats(userId){
	fetch(`/get_stats?login=${userId}`)
	.then(response => {
		if (!response.ok) {
			throw new Error('Error getting stats');
		}
		return response.json();
	})
	.then(data => {
		return (data);
	})
	.catch(error => {
		console.error(error);
	});	
}

function openForm() {
	if (roomCode === undefined)
		return ;
	get_room(roomCode)
		.then(room => {
			if (room['player_1']['username'] != null && room['player_2']['username'] != null) {
				const player1 = document.getElementById('player1-win');
				const player2 = document.getElementById('player2-win');
				player1.innerHTML = room['player_1']['username'];
				player2.innerHTML = room['player_2']['username'];
				document.getElementById("myForm").style.display = "block";
				document.getElementById("open-button").removeEventListener('click', openForm);
				player1.addEventListener('click', player1Win);
				player1.addEventListener('click', closeForm);
				player2.addEventListener('click', player2Win);
				player2.addEventListener('click', closeForm);
				roomError.innerHTML = '';
			}
			else {
				roomError.innerHTML = "You need to be in a room with 2 players to start a game.";
			}
		})
  }
  
function closeForm() {
	document.getElementById("myForm").style.display = "none";
	document.getElementById("open-button").addEventListener('click', openForm);
	document.getElementById("open-button").removeEventListener('click', closeForm);
}

// function animateDots(document, position) {
// 	document.textContent = 'Player ' + position + ': Waiting for someone to join';
// 	let dots = '';
// 	let inter = setInterval(() => {
// 			if (dots.length === 3) {
// 				dots = '';
// 			} else {
// 				dots += '.';
// 			}
// 			document.textContent = 'Player ' + position + ': Waiting for someone to join' + dots;
// 			if (position == 1 && player1_animation == false) {
// 				clearInterval(inter);
// 			}
// 			if (position == 2 && player2_animation == false) {
// 				clearInterval(inter);
// 			}
// 	}, 300);
// }

function	resetMatch(){
	roomCode = undefined;
	document.getElementById("myForm").style.display = "none";
	document.getElementById('createRoom').classList.remove('shrinked');
	document.getElementById('createRoom').classList.remove('shrinked2');
	document.getElementById('joinRoom').classList.remove('shrinked');
	document.getElementById('joinRoom').classList.remove('shrinked2');
	document.getElementById('roomcode').classList.remove('created');
	document.getElementById('roomcode').classList.remove('created_right');
	document.getElementById('roomcode').disabled = false;
	document.getElementById('roomcode').value = '';
	document.getElementById('copyRoomCode').classList.remove('created');
	document.getElementById('copyRoomCode2').classList.remove('created');
	document.getElementById('player1_name').textContent = '';
	document.getElementById('player2_name').textContent = '';
	document.getElementById('open-button').disabled = true;
}

function	fade_button(){
	let button = document.getElementById('createRoom');
	button.classList.add('shrinked');
	let joinButton = document.getElementById('joinRoom');
	joinButton.classList.add('shrinked');
	let roomCodeElem = document.getElementById('roomcode');
	roomCodeElem.classList.add('created');
	roomCodeElem.disabled = true;
	let copyButton = document.getElementById('copyRoomCode');
	copyButton.classList.add('created');
}

function	fade_button_right(){
	let button = document.getElementById('createRoom');
	button.classList.add('shrinked2');
	let joinButton = document.getElementById('joinRoom');
	joinButton.classList.add('shrinked2');
	let roomCodeElem = document.getElementById('roomcode');
	roomCodeElem.classList.add('created_right');
	roomCodeElem.disabled = true;
	let copyButton = document.getElementById('copyRoomCode2');
	copyButton.classList.add('created');
}

function	copyRoomCode(){
	let	roomCodeElem = document.getElementById('roomcode');
	roomCodeElem.select();
	roomCodeElem.setSelectionRange(0, 99999);
	navigator.clipboard.writeText(roomCodeElem.value);
}

function	leaveRoom(){
	resetMatch();
	document.getElementById('leave-button').style.display = 'none';
	socket.emit("leave", {'username': userId})
	// player1_animation = false;
	// player2_animation = false;
	document.getElementById('player1_name').textContent = '';
	document.getElementById('player2_name').textContent = '';
	roomCode = undefined;
}

function	joinRoom(){
	if (userId === undefined){
		roomError.innerHTML = 'Please log in first';
		return;
	}
	roomCode = document.getElementById('roomcode').value;
	socket.emit("join", {'username': userId, 'room': roomCode}, (response, code) => {
		if (code !== 200){
			roomError.innerHTML = response['message'];
			return ;
		}
		document.getElementById('roomcode').value = roomCode;
		fade_button_right();
		roomCode = response['room_code']
		updatePlayers(response);
		document.getElementById('leave-button').style.display = 'unset';
		roomError.innerHTML = '';
	});
}

function	createRoom(){
	if (userId === undefined){
		roomError.innerHTML = 'Please log in first';
		return;
	}
	socket.emit('create',{"username": userId}, (response, code) => {
		console.log(response);
		console.log(code);
		if (code !== 200){
			roomError.innerHTML = response['message'];
			return ;
		}
		document.getElementById('roomcode').value = response['room_code'];
		roomCode = response['room_code']
		fade_button();
		// animateDots();
		roomError.innerHTML = '';
		document.getElementById('leave-button').style.display = 'unset';
		updatePlayers(response);
	});
}

function	player1Win(){
	get_room(roomCode)
	.then(room => {
		console.log(room);
		fetch(`/declare_winner?roomCode=${roomCode}&winner=${room['player_1']['username']}&loser=${room['player_2']['username']}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({userId})
		})
		.then(response => {
			console.log(response);
			if (!response.ok) {
				throw new Error('Error declaring winner');
			}
			return response.json();
		})
		.then(data => {
			console.log(data);
			resetMatch();
			updateElo(userId);
	
		})
		.catch(error => {
			console.error(error);
		});	
	})
	.catch(error => {
		console.error(error);
	});
};

function	player2Win(){
	get_room(roomCode)
	.then(room => {
		console.log('ROOM');
		console.log(room);
		fetch(`/declare_winner?roomCode=${roomCode}&winner=${room['player_2']['username']}&loser=${room['player_1']['username']}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({userId})
		})
		.then(response => {
			if (!response.ok) {
				throw new Error('Error declaring winner');
			}
			return response.json();
		})
		.then(data => {
			console.log(data);
			updateElo(userId);
			resetMatch();
		})
		.catch(error => {
			console.error(error);
		});	
	})
	.catch(error => {
		console.error(error);
	});
};

function	startGame(){
	if (userId === undefined){
		roomError.innerHTML = 'Please log in first';
		return;
	}
	if (roomCode === undefined){
		roomError.innerHTML = 'Please create or join a room first';
		return;
	}
	fetch(`/start_game?roomCode=${roomCode}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({userId})
	})
	.then(response => {
		if (!response.ok) {
			throw new Error('Error starting game');
		}
		return response.json();
	})
	.then(data => {
		document.getElementById('start').innerHTML = 'Game started';
		document.getElementById('start').disabled = 'true';
		roomError.innerHTML = '';
	})
	.catch(error => {
		console.error(error);
	});	
}

function	updateElo(userId) {
	fetch(`/get_stats?player=${userId}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(userId)
	})
	.then(response => response.json())
	.then(stats => {
		document.getElementById('elo').innerHTML = stats['elo'];
	})
}

function	getUserInfo() {
	fetch(`/get_user_info`)
		.then(response => response.json())
		.then(data =>{
			console.log(data);
			userId = data['userId'];
			document.getElementById('user-id').innerHTML = userId;
			let img = document.createElement('img');
			img.src = data['image'];
			console.log(img.src);
			img.alt = 'profile picture';
			img.id = 'profile_pic';
			img.classList.add('profile_pic');
			document.getElementById('menu-item-container').appendChild(img);
			fetch(`/get_stats?player=${userId}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({userId})
			})
			.then(response => response.json())
			.then(data => {
				document.getElementById('elo').innerHTML = data['elo'];
				roomError.innerHTML = '';
			})
		})
}

window.onload = function(){
	getUserInfo();
	document.getElementById('roomcode').value = null;
	document.getElementById('roomcode').placeholder = 'ROOM CODE';
	socket.on("connect", function() {
		console.log("Connected to socket");
	})
}