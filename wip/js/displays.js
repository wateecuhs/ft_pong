function	joinRoomDisplay() {
	document.getElementById('hidden-room-input').classList.remove('hidden');
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
	document.getElementById('blocker-code').value = roomCode;
	document.getElementById('live-match-container').classList.remove('hidden');
	document.getElementById('in-room-blocker').classList.remove('hidden');
	document.getElementById('hidden-room-input').classList.add('hidden');
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
