var socket = io();

socket.on("user_joined", function(data) {
	if (data['player_1']['username'] !== null)
		document.getElementById('player1-display').innerHTML = data['player_1']['username'];
	else
		document.getElementById('player1-display').innerHTML = 'Waiting...';
	if (data['player_2']['username'] !== null)
		document.getElementById('player2-display').innerHTML = data['player_2']['username'];
	else
		document.getElementById('player2-display').innerHTML = 'Waiting...';
})

socket.on("user_left", function(data) {
	if (data['player_1']['username'] !== null)
		document.getElementById('player1-display').innerHTML = data['player_1']['username'];
	else
		document.getElementById('player1-display').innerHTML = 'Waiting...';
	if (data['player_2']['username'] !== null)
		document.getElementById('player2-display').innerHTML = data['player_2']['username'];
	else
		document.getElementById('player2-display').innerHTML = 'Waiting...';
})

socket.on("player_voted", function(response) {
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
})

socket.on("game_started", function() {
	displayMatch();
})

socket.on("game_ended", function() {
	console.log("game ended");
	getUser();
	renderLeaderboard();
})
