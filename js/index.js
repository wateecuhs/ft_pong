var roomCode = undefined;
var roomError = document.getElementById('errors');

function	copyCode(){
	let	roomCodeElem = document.getElementById('blocker-code');
	roomCodeElem.select();
	roomCodeElem.setSelectionRange(0, 99999);
	navigator.clipboard.writeText(roomCodeElem.value);
}

function	leaveRoom(){
	socket.emit("leave", (response, code) => {
	});
	document.getElementById('player1-display').textContent = 'Waiting...';
	document.getElementById('player2-display').textContent = 'Waiting...';
	roomCode = undefined;
	document.getElementById('player1-vote-count').innerHTML ='0/2';
	document.getElementById('player2-vote-count').innerHTML ='0/2';
	hideRoomTab();
}

function	player1Vote() {
	console.log('player1 vote');
	socket.emit('player1_vote',(response, code) => {
		console.log(response);
		if (code !== 200){
			roomError.innerHTML = response['message'];
			return ;
		}
		roomError.innerHTML = "";
		if (response['player1_vote'] === response['player2_vote'] && response['player1_vote'] !== null){
			console.log('leaveing room');
			leaveRoom();
		}
		let	vote1 = 0;
		let	vote2 = 0;
		if (response['player1_vote'] === 1)
			vote1 += 1;
		else if (response['player1_vote'] === 2)
			vote2 += 1;
		if (response['player2_vote'] === 1)
			vote1 += 1;
		else if (response['player2_vote'] === 2)
			vote2 += 1;
		console.log('dispalying vote');
		displayVotes(vote1, vote2);
	});
	console.log('player1 voted');
}

function	player2Vote() {
	socket.emit('player2_vote', (response, code) => {
		if (code !== 200){
			roomError.innerHTML = response['message'];
			return ;
		}
		roomError.innerHTML = "";
		if (response['player1_vote'] === response['player2_vote'] && response['player1_vote'] !== null){
			leaveRoom();
		}
		let	vote1 = 0;
		let	vote2 = 0;
		if (response['player1_vote'] === 1)
			vote1 += 1;
		else if (response['player1_vote'] === 2)
			vote2 += 1;
		if (response['player2_vote'] === 1)
			vote1 += 1;
		else if (response['player2_vote'] === 2)
			vote2 += 1;
		displayVotes(vote1, vote2);
	});
}

function	createRoom(){
	socket.emit('create', (response, code) => {
		if (code !== 200){
			roomError.innerHTML = response['message'];
			return ;
		}
		roomCode = response['room_code']
		displayRoomTab(roomCode);
		roomError.innerHTML = "";
	});
}

function	joinRoom(){
	let attemptedCode = document.getElementById('hidden-input').value;
	socket.emit("join", {'room': attemptedCode}, (response, code) => {
		if (code !== 200){
			roomError.innerHTML = response['message'];
			return ;
		}
		roomCode = response['room_code'];
		displayRoomTab(roomCode);
		roomError.innerHTML = "";
	});
}

function	startMatch(){
	socket.emit('start', (response, code) => {
		if (code !== 200){
			roomError.innerHTML = response['message'];
			return ;
		}
		displayMatch();
		roomError.innerHTML = "";
	});
}

function	updateStats(userId) {
	fetch(`/get_stats?player=${userId}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(userId)
	})
	.then(response => response.json())
	.then(stats => {
		document.getElementById('elo-display').innerHTML = 'elo: ' + stats['elo'];
		document.getElementById('games-display').innerHTML = 'games played: ' + stats['games'];
		document.getElementById('wins-display').innerHTML = 'wins: ' + stats['wins'];
		document.getElementById('losses-display').innerHTML = 'losses: ' + stats['losses'];
	})
}

function	getUser() {
	fetch(`/get_user_info`)
		.then(response => response.json())
		.then(data =>{
			let username = document.getElementById('username');
			username.innerHTML = data['username'];
			document.getElementById('profile-pic').src = data['image'];
			updateStats(data['username']);
			if (data['room'] !== null){
				setTimeout(() => {
					roomCode = data['room'];
					displayRoomTab(roomCode);
				}, 1000);
			}
		})
}

window.onload = function () {
	document.getElementById('hidden-input').value = "";
	getUser();
	renderLeaderboard();
	setInterval(renderLeaderboard, 60000);
} 