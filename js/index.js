var userId = undefined;
var roomCode = undefined;
var animateDotsBool = false;
const roomError = document.getElementById('room_errors');

function openForm() {
	document.getElementById("myForm").style.display = "block";
	document.getElementById("open-button").addEventListener('click', closeForm);
	document.getElementById("open-button").removeEventListener('click', openForm);
  }
  
function closeForm() {
	document.getElementById("myForm").style.display = "none";
	document.getElementById("open-button").addEventListener('click', openForm);
	document.getElementById("open-button").removeEventListener('click', closeForm);
}

function	tempLogin(){
	userId = document.getElementById('player1').value;
	fetch(`/get_stats?player=${userId}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({userId})
	}).then(response => response.json())
	.then(data => {
		document.getElementById('elo').innerHTML = data;
	})
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
				.then(elo => {
					document.getElementById('player2_name').textContent = 'Player 2: ' + data['player'] + ' (' + elo + ')';
				})
				clearTimeout(test);
			}
		})
		.catch(error => {
			console.log(error);
		});
		var test = setTimeout(waitingForPlayer, 1000);
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
		.then(elo => {
			console.log(elo);
			player1.textContent = 'Player 1: ' + data['player1'] + ' (' + elo + ')';
		})
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

function	declareWinner(){
	fetch(`/declare_winner?roomCode=${roomCode}?winner=${winner}?loser=${loser}`, {
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

	})
	.catch(error => {
		console.error(error);
	});	

}

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

function getCodeFromUrl() {
	const queryParams = new URLSearchParams(window.location.search);
	const code = queryParams.get('code');
	return code;
}

function	loginAuth(code){
	fetch(`/auth/42/callback?code=${code}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({code})
	}).then(response => {
		if (!response.ok) {
			throw new Error('Error logging in');
		}
		return response.json();
	}).then(data => {
		console.log(data);
		userId = data['userId'];
		document.getElementById('login').disabled = true;
		document.getElementById('login').textContent = userId;
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
			document.getElementById('elo').innerHTML = data;
			roomError.innerHTML = '';
		})
	});
}

window.onload = function(){
	document.getElementById('roomcode').value = null;
	document.getElementById('roomcode').placeholder = 'ROOM CODE';
	document.getElementById('login').addEventListener('click', tempLogin);
	const code = getCodeFromUrl();
	console.log(code);
	if (code !== null) {
		loginAuth(code);
	}
	
}