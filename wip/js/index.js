var roomCode = undefined;

function	copyCode(){
	console.log('here');
	let	roomCodeElem = document.getElementById('blocker-code');
	roomCodeElem.select();
	roomCodeElem.setSelectionRange(0, 99999);
	navigator.clipboard.writeText(roomCodeElem.value);
}

function	isMatchValid() {
	return true;
}

function	isRoomValid() {
	return true;
}

function	player1Vote() {
	leaveRoom();
}

function	player2Vote() {
	leaveRoom();
}

function	createRoom(){
	socket.emit('create',{"username": userId}, (response, code) => {
		if (code !== 200){
			roomError.innerHTML = response['message'];
			return ;
		}
		roomCode = response['room_code']
		displayRoomTab(roomCode);
		roomError.innerHTML = "";
	});
}

function	joinRoom() {
	roomCode = document.getElementById('hidden-input').value;
	if (isRoomValid(roomCode) === true) {
		displayRoomTab(roomCode);
	}
}

window.onload = function () {
	document.getElementById('hidden-input').value = "";
}