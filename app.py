from flask import Flask, render_template, send_from_directory, request, jsonify, Response, redirect,send_file
import json
import string
import random
import os
import requests
import datetime

app = Flask(__name__)
def id_generator():
	return ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(6))

def updateElo(winner, loser):
	R1 = winner['elo']
	R2 = loser['elo']
	if (winner['wins'] + winner['losses']) > 10:
		k1 = 16
	else:
		k1 = 32
	if (loser['wins'] + loser['losses']) > 10:
		k2 = 16
	else:
		k2 = 32
	E1 = 1 / (1 + 10 ** ((R2 - R1) / 400))
	E2 = 1 / (1 + 10 ** ((R1 - R2) / 400))
	R1 = R1 + k1 * (1 - E1)
	R2 = R2 + k2 * (0 - E2)
	return (R1, R2)

@app.route("/declare_winner", methods=['POST'])
def declare_winner():
	winner = request.args['winner']
	loser = request.args['loser']
	roomCode = request.args['roomCode']
	with open('rooms.json', 'r') as file:
		rooms = json.load(file)
	for room in rooms:
		if room['roomCode'] == roomCode:
			room['status'] = "Finished"
			with open('database.json', 'r') as file:
				data = json.load(file)
			for player in data:
				if player['login'] == winner:
					stats_winner = player['stats']
				if player['login'] == loser:
					stats_loser = player['stats']
			stats_winner['elo'], stats_loser['elo'] = updateElo(stats_winner['elo'], stats_loser['elo'])
			with open('rooms.json', 'w') as file:
				json.dump(rooms, file, sort_keys=True, indent='\t', separators=(',', ': '))
			return jsonify({"message" : f"Winner declared in room {roomCode}"}), 200
	return jsonify({"message" : "Couldn't declare winner"}), 404

@app.route("/start_game", methods=['POST'])
def start_game():
	roomCode = request.args['roomCode']
	with open('rooms.json', 'r') as file:
		rooms = json.load(file)
	for room in rooms:
		if room['roomCode'] == roomCode and room['player1'] != None and room['player2'] != None:
			room['status'] = "Playing"
			with open('rooms.json', 'w') as file:
				json.dump(rooms, file, sort_keys=True, indent='\t', separators=(',', ': '))
			return jsonify({"message" : f"Game started in room {roomCode}"}), 200
	return jsonify({"message" : "Couldn't start match"}), 404

@app.route("/room_status", methods=['POST'])
def room_status():
	user = request.args['player']
	with open('rooms.json', 'r') as file:
		rooms = json.load(file)
	for room in rooms:
		if room['player1'] == user :
			if (room['player2'] == None):
				return jsonify({"status" : "Waiting for player 2"}), 409
			else:
				return jsonify({"status" : "Ready", "player" : room['player2']}), 200

@app.route("/join_room", methods=['POST'])
def join_room():
	user = request.args['player']
	roomCode = request.args['roomCode']
	with open('rooms.json', 'r') as file:
		rooms = json.load(file)
	for room in rooms:
		if room['roomCode'] == roomCode:
			if room['player1'] == user or room['player2'] == user:
				if room['player1'] == user:
					return jsonify({"message" : f"Player {user} joined room {roomCode}", "player1" : room['player1'], 'roomCode': roomCode}), 200
				else:
					return jsonify({"message" : f"Player {user} joined room {roomCode}", "player1" : room['player1'], 'roomCode': roomCode}), 200
			if room['player2'] == None:
				room['player2'] = user
				with open('rooms.json', 'w') as file:
					json.dump(rooms, file, sort_keys=True, indent='\t', separators=(',', ': '))
				return jsonify({"message" : f"Player {user} joined room {roomCode}", "player1" : room['player1'], 'roomCode': roomCode}), 200
			else:
				return jsonify({"message" : f"Room {roomCode} is full", 'roomCode': roomCode}), 409
	return jsonify({"message" : f"Room {roomCode} not found", 'roomCode': roomCode}), 404

@app.route("/create_room", methods=['POST'])
def create_room():
	user = request.args['player']
	with open('rooms.json', 'r') as file:
		rooms = json.load(file)
	for room in rooms:
		if room['player1'] == user or room['player2'] == user:
			return jsonify({"message" : f"Player already in a room ({room['roomCode']})", 'roomCode': room['roomCode']}), 409
	roomCode = id_generator()
	rooms.append({"roomCode": roomCode, "player1": user, "player2": None, "status": "Waiting for player 2"})
	with open('rooms.json', 'w') as file:
		json.dump(rooms, file, sort_keys=True, indent='\t', separators=(',', ': '))
	return jsonify({"roomCode": roomCode}), 200

@app.route("/get_stats", methods=['POST'])
def get_stats():
	login = request.args['player']
	with open('database.json', 'r') as file:
		data = json.load(file)
	for player in data:
		if player['login'] == login:
			return (jsonify(player['stats']['elo']))
	player = {
		"login": login,
		"stats": {
			"elo": 500
		}
	}
	data.append(player)
	with open('database.json', 'w') as file:
		json.dump(data, file, sort_keys=True, indent='\t', separators=(',', ': '))
	return (jsonify(player['stats']['elo']))

@app.route("/send_invite", methods=['POST'])
def send_invite():
	invite = request.args
	if (invite['from'] == invite['to']):
		return jsonify({"message": "You cannot invite yourself"}), 400
	with open('database.json', 'r') as file:
		data = json.load(file)
	for user in data:
		if user['login'] == invite['to']:
			if (invite['from'] in [inv['from'] for inv in user['invites']]):
				return jsonify({"message": "Player already invited"}), 409
			user['invites'].append({'from': invite['from'], 'time': datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")})
			with open('database.json', 'w') as file:
				json.dump(data, file, sort_keys=True, indent='\t', separators=(',', ': '))
			return jsonify({"message": "Invite sent successfully"}), 200
	else:
		return jsonify({"message": "Player not found"}), 404
	
@app.route('/auth/42/callback', methods=['POST'])
def auth_callback():
	code = request.args.get('code')

	token_url = 'https://api.intra.42.fr/oauth/token'
	with open('API_DONT_PUSH.json', 'r') as file:
		api = json.load(file)
	client_id = api['client_id']
	client_secret = api['client_secret']
	redirect_uri = 'http://127.0.0.1:5000/'
	params = {
		'grant_type': 'authorization_code',
		'client_id': client_id,
		'client_secret': client_secret,
		'code': code,
		'redirect_uri': redirect_uri
	}
	response = requests.post(token_url, data=params)
	print(response.json())
	if response.ok:
		access_token = response.json()['access_token']
		response = requests.get('https://api.intra.42.fr/v2/me', headers={'Authorization': f'Bearer {access_token}'}).json()
		return {"userId": response['login'], "image": response['image']['versions']['small']}, 200
	else:
		return 'Token exchange failed', 400

@app.route('/match/<roomCode>', methods=['GET'])
def match(roomCode):
	return render_template("match.html", roomCode=roomCode)

@app.route("/")
def render_page():
	return render_template("index.html")\

@app.route('/<path:filename>')
def serve_file(filename):
	return send_from_directory('.', filename)

if __name__ == "__main__":
	app.run(host='0.0.0.0')