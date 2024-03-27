async function	get_room(roomCode){
	return fetch(`/get_room?roomCode=${roomCode}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		}
		})
	.then(response => {
		console.log(response);
		if (!response.ok) {
			throw new Error('Error getting room');
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

function	joinRoomDisplay() {
	document.getElementById('hidden-room-input').classList.remove('hidden');
}

function	displayVotes(vote1, vote2) {
	document.getElementById('player1-vote-count').innerHTML = vote1 + '/2';
	document.getElementById('player2-vote-count').innerHTML = vote2 + '/2';
}

function	hideJoinRoomDisplay() {
	document.getElementById('hidden-room-input').classList.add('hidden');
}

function	hideRoomTab() {
	roomCode = undefined;
	document.getElementById('live-match-container').classList.add('hidden');
	document.getElementById('in-room-blocker').classList.add('hidden');
	setTimeout(() => {
		document.getElementById('player1-vote').classList.add('hidden');
		document.getElementById('player2-vote').classList.add('hidden');
		let roomText = document.getElementById('room-text');
		roomText.innerHTML = 'ROOM';
		document.getElementById('start-match').classList.remove('hidden');
		document.getElementById('player1-vote-count').classList.add('hidden');
		document.getElementById('player2-vote-count').classList.add('hidden');
		document.getElementById('note').classList.add('hidden');
		document.getElementById('leave-room').disabled = false;
}, 1000);
}

function	displayRoomTab(roomCode) {
	get_room(roomCode)
		.then(data => {
			if (data['player_1']['username'] !== null)
				document.getElementById('player1-display').innerHTML = data['player_1']['username'];
			else
				document.getElementById('player1-display').innerHTML = 'Waiting...';
			if (data['player_2']['username'] !== null)
				document.getElementById('player2-display').innerHTML = data['player_2']['username'];
			else
				document.getElementById('player2-display').innerHTML = 'Waiting...';
			document.getElementById('blocker-code').value = roomCode;
			document.getElementById('live-match-container').classList.remove('hidden');
			document.getElementById('in-room-blocker').classList.remove('hidden');
			document.getElementById('hidden-room-input').classList.add('hidden');
			setTimeout(() => {
			if (data['status'] === 'Playing') {
				displayMatch();
				}
			}, 500);
		});
}

function	displayMatch() {
	let roomText = document.getElementById('room-text');
	document.getElementById('start-match').classList.add('hidden');
	document.getElementById('leave-room').disabled = true;
	roomText.classList.add('hidden');
	setTimeout(() => {
		roomText.innerHTML = 'ONGOING MATCH';
		roomText.classList.remove('hidden');
		document.getElementById('player1-vote').classList.remove('hidden');
		document.getElementById('player2-vote').classList.remove('hidden');
		document.getElementById('player1-vote-count').classList.remove('hidden');
		document.getElementById('player2-vote-count').classList.remove('hidden');
		document.getElementById('note').classList.remove('hidden');
	}, 500);
}

function	renderLeaderboard() {
	let i = 0;
	fetch(`/get_leaderboard`)
		.then(response => response.json())
		.then(data =>{
			document.querySelectorAll('.leaderboard-row').forEach(function(row) {
				row.remove();
			});
			data.forEach(element => {
				let row = document.createElement("div");
				let name = document.createElement('h1');
				let img = document.createElement('img');
				let winrate = document.createElement('h1');
				let elo = document.createElement('h1');
				img.src = element['image'];
				img.alt	= 'player picture';
				winrate.innerHTML = element['wins'] + 'W/' + element['losses'] + 'L<br>(' + Math.round(element['wins'] / (element['wins']  + element['losses']) * 100) + '%)';
				name.innerHTML = element['username'];
				elo.innerHTML = element['elo'];
				row.appendChild(img);
				row.appendChild(name);
				row.appendChild(winrate);
				document.getElementById('leaderboard').appendChild(row);
				img.classList.add('leaderboard-pics');
				row.classList.add('leaderboard-row')
				name.classList.add('leaderboard-stats');
				name.classList.add('username');
				winrate.classList.add('leaderboard-stats');
				winrate.classList.add('winrate');
				elo.classList.add('leaderboard-stats');
				elo.classList.add('elo');
				if (i == 0) {
					let crown = document.createElement('img');
					crown.src = '/assets/crown.png';
					crown.alt = 'crown';
					crown.classList.add('crown');
					crown.classList.add('leaderboard-pics');
					row.appendChild(crown);
					row.classList.add('first-place');
				}
				if (i == 1) {
					row.classList.add('second-place');
				}
				if (i == 2) {
					row.classList.add('third-place');
				}
				i++;
				row.appendChild(elo);
			})
		})
}