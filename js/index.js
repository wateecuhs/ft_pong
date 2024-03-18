var socket = io();
		socket.on('connect', function() {
		socket.emit('join', {
			"username": 'panger',
			"room": 'QWEASD'
		});
});
var userId = undefined;
var roomCode = undefined;
var animateDotsBool = false;
const roomError = document.getElementById('room_errors');
var playerwait = undefined;

async function	get_room(roomCode){
	return fetch(`/get_room?roomCode=${roomCode}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({userId})
		})
	.then(response => {
		if (!response.ok) {
			throw new Error('Error getting room');
		}
		return response.json();
	})
	.then(data => {
		console.log(data);
		console.log('RETURNING THIS SHIT\n');
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
	document.getElementById("myForm").style.display = "block";
	document.getElementById("open-button").removeEventListener('click', openForm);
  }
  
function closeForm() {
	document.getElementById("myForm").style.display = "none";
	document.getElementById("open-button").addEventListener('click', openForm);
	document.getElementById("open-button").removeEventListener('click', closeForm);
}

function animateDots() {
	const player1 = document.getElementById('player1_name');
	const player2 = document.getElementById('player2_name');
	var player1Elo = document.getElementById('elo').innerHTML;
	player1.textContent = 'Player 1: You (' + player1Elo + ')';
	player2.textContent = 'Player 2: Waiting for someone to join';
	let dots = '';
	setInterval(() => {
		if (animateDotsBool) {
			if (dots.length === 3) {
				dots = '';
			} else {
				dots += '.';
			}
			player2.textContent = 'Player 2: Waiting for someone to join' + dots;
		}
	}, 300);
}

function	resetMatch(){
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
	animateDotsBool = false;
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

function	waitingForPlayer(){
	fetch(`/room_status?player=${userId}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({userId})
		})
		.then(response => response.json())
		.then(data => {
			console.log(data);
			if (data['status'] === 'Ready'){
				animateDotsBool = false;
				fetch(`/get_stats?player=${data['player']}`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(data['player'])
				})
				.then(response => response.json())
				.then(stats => {
					document.getElementById('player2_name').textContent = 'Player 2: ' + data['player'] + ' (' + stats['elo'] + ')';
					document.getElementById('open-button').disabled = false;
					document.getElementById('player1-win').addEventListener('click', player1Win);
					document.getElementById('player1-win').addEventListener('click', closeForm);
					document.getElementById('player2-win').addEventListener('click', player2Win);
					document.getElementById('player2-win').addEventListener('click', closeForm);
				})
				clearTimeout(test);
			}
		})
		.catch(error => {
			console.log(error);
		});
		playerwait = setTimeout(waitingForPlayer, 1000);
}

function	leaveRoom(){
	resetMatch();
	document.getElementById('leave-button').style.display = 'none';

	clearTimeout(playerwait);
}

function	joinRoom(){
	if (userId === undefined){
		roomError.innerHTML = 'Please log in first';
		return;
	}
	roomCode = document.getElementById('roomcode').value;
	fetch(`/join_room?player=${userId}&roomCode=${roomCode}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({userId})
	})
	.then(response => {
		if (!response.ok) {
			roomError.innerHTML = 'Error joining room';
			throw new Error('Error joining room');
		}
		return response.json();
	})
	.then(data => {
		console.log(data);
		document.getElementById('roomcode').value = roomCode;
		fade_button_right();
		const player1 = document.getElementById('player1_name');
		const player2 = document.getElementById('player2_name');
		var player2Elo = document.getElementById('elo').innerHTML;
		fetch(`/get_stats?player=${data['player1']}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data['player'])
		})
		.then(response => response.json())
		.then(stats => {
			player1.textContent = 'Player 1: ' + data['player1'] + ' (' + stats['elo'] + ')';
		})
			document.getElementById('leave-button').style.display = 'unset';
			if (data['player1'] === userId){
				animateDotsBool = true;
				animateDots();
				waitingForPlayer();
		}
		else{
			player2.textContent = 'Player 2: You (' + player2Elo + ')';
		}
		roomError.innerHTML = '';
	})
	.catch(error => {
		console.error(error.message);
	});	
}

function	createRoom(){
	if (userId === undefined){
		roomError.innerHTML = 'Please log in first';
		return;
	}
	fetch(`/create_room?player=${userId}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({userId})
	})
	.then(async response => {
		if (!response.ok) {
			if (response.status === 409)
			{
				let data = await response.json();
				console.log(data);
				roomError.innerHTML = 'Error creating room: User already has a room (' + data['roomCode'] +')';
			}
			throw new Error('Error creating room');
		}
		return response.json();
	})
	.then(data => {
		console.log(data);
		document.getElementById('roomcode').value = data.roomCode;
		fade_button();
		animateDotsBool = true;
		animateDots();
		waitingForPlayer();
		roomError.innerHTML = '';
	})
	.catch(error => {
		console.error(error);
	});	
}

function	player1Win(){
	get_room(roomCode)
	.then(room => {
		console.log('ROOM');
		console.log(room);
		fetch(`/declare_winner?roomCode=${roomCode}&winner=${room['player1']}&loser=${room['player2']}`, {
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
		fetch(`/declare_winner?roomCode=${roomCode}&winner=${room['player2']}&loser=${room['player1']}`, {
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
	socket.emit()
}