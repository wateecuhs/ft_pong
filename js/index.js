var userId = undefined;
var roomCode = undefined;

function animateDots() {
	const player1 = document.getElementById('player1_name');
	const player2 = document.getElementById('player2_name');
	player1.textContent = 'Player 1: You (' + userId + ')';
	player2.textContent = 'Player 2: Waiting for someone to join';
	let dots = '';
	setInterval(() => {
		if (dots.length === 3) {
			dots = '';
		} else {
			dots += '.';
		}
		player2.textContent = 'Player 2: Waiting for someone to join' + dots;
	}, 300);
}

function	fade_button(){
	let button = document.getElementById('createRoom');
	button.classList.add('shrinked');
	let joinButton = document.getElementById('joinRoom');
	joinButton.classList.add('shrinked');
	setTimeout(function() {
		button.remove();
	}, 500);
	roomCode = document.getElementById('roomcode');
	roomCode.classList.add('created');
	roomCode.disabled = true;
	let copyButton = document.getElementById('copyRoomCode');
	copyButton.classList.add('created');
}

function	fade_button_right(){
	let button = document.getElementById('createRoom');
	button.classList.add('shrinked');
	let joinButton = document.getElementById('joinRoom');
	joinButton.classList.add('shrinked');
	setTimeout(function() {
		button.remove();
	}, 500);
	roomCode = document.getElementById('roomcode');
	roomCode.classList.add('created_right');
	roomCode.disabled = true;
	let copyButton = document.getElementById('copyRoomCode2');
	copyButton.classList.add('created');
}

function	copyRoomCode(){
	var	roomCode = document.getElementById('roomcode');
	roomCode.select();
	roomCode.setSelectionRange(0, 99999);
	navigator.clipboard.writeText(roomCode.value);
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

function	joinRoom(){
	if (userId === undefined){
		alert('Please log in first');
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
			throw new Error('Error joining room');
        }
        return response.json();
    })
    .then(data => {
		console.log(data);
        document.getElementById('roomcode').value = roomCode;
		fade_button_right();
    })
    .catch(error => {
		console.error(error.message);
        alert('Error creating room');
    });	
}

function	createRoom(){
	if (userId === undefined){
		alert('Please log in first');
		return;
	}
	fetch(`/create_room?player=${userId}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({userId})
	})
	.then(response => {
        if (!response.ok) {
            throw new Error('Error creating room');
        }
        return response.json();
    })
    .then(data => {
        console.log(data);
        document.getElementById('roomcode').value = data.roomCode;
        fade_button();
        animateDots();
    })
    .catch(error => {
        console.error(error.message);
        alert('Error creating room');
    });	
}

window.onload = function(){
	document.getElementById('login').addEventListener('click', tempLogin);
	document.getElementById('roomcode').value = 'ROOM CODE';
}