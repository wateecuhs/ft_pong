from flask import Flask, render_template, send_from_directory, request, jsonify, Response, redirect,send_file, session
import json
import string
import random
import requests
from flask_socketio import SocketIO, send, emit, join_room, leave_room
from db import UserDB

app = Flask(__name__)

with open('API_DONT_PUSH.json', 'r') as file:
	api = json.load(file)
app.secret_key = api[0]['flask_secret']
client = UserDB(api[0]['connection_string'])
socketio = SocketIO(app)

@socketio.on('join')
def on_join(data):
	print(data)
	username = data['username']
	room = data['room']
	join_room(room)
	send(username + ' has entered the room.', to=room)

@socketio.on('leave')
def on_leave(data):
	username = data['username']
	room = data['room']
	leave_room(room)
	send(username + ' has left the room.', to=room)

@app.route("/get_room", methods=['POST'])
def	get_room():
	roomCode = request.args['roomCode']
	room = client.get_room(room_code=roomCode)
	if room:
		return jsonify(room), 200
	return jsonify({"message" : "Room not found"}), 404

@app.route("/get_stats", methods=['POST'])
def get_stats():
	login = request.args['player']
	data = client.get_user(login)
	if data:
		return jsonify(data['stats']), 200
	return jsonify({"message" : "player not found"}), 404

def id_generator():
	return ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(6))

def updateElo(winner, loser):
	k = 32
	R1 = winner
	R2 = loser
	E1 = 1 / (1 + 10 ** ((R2 - R1) / 400))
	E2 = 1 / (1 + 10 ** ((R1 - R2) / 400))
	R1 = R1 + k * (1 - E1)
	R2 = R2 + k * (0 - E2)
	return (int(R1), int(R2))

@app.route("/declare_winner", methods=['POST'])
def declare_winner():
	winner = request.args['winner']
	loser = request.args['loser']
	roomCode = request.args['roomCode']
	room = client.get_room(roomCode)
	winner_data = client.get_user(winner)
	loser_data = client.get_user(loser)
	if room is None or winner_data is None or loser_data is None:
		return "error", 404
	winner_data['stats']['elo'], loser_data['stats']['elo'] = updateElo(winner_data['stats']['elo'], loser_data['stats']['elo'])
	client.delete_room(room)
	return "good", 200

@app.route("/start_game", methods=['POST'])
def start_game():
	roomCode = request.args['roomCode']
	room = client.get_room(roomCode)
	if room['player_1'] is None or room['player_2'] is None:
		return "Need 2 players", 404
	room['status'] = 'Playing'
	return jsonify({"message" : f"Game started in room {roomCode}"}), 200

@app.route("/join_room", methods=['POST'])
def join_room():
	user = request.args['player']
	roomCode = request.args['roomCode']
	player = client.get_user(user)
	room = client.get_room(roomCode)
	if room is None:
		return "Room not found", 404
	if player['room'] != None:
		return "Player already in a room", 409
	if room['player_1'] != None and room['player_2'] != None:
		return "Room is full", 409
	if room['player_1'] is None:
		room['player_1'] == player['username']
		player['room'] = roomCode
		return "Player succesfully joined", 200
	elif room['player_2'] is None:
		room['player_2'] == player['username']
		player['room'] = roomCode
		return "Player succesfully joined", 200

@app.route("/create_room", methods=['POST'])
def create_room():
	user = request.args['player']
	player = client.get_user(user)
	if player['room'] == None:
		room_code = id_generator()
		client.create_room(player, room_code)
		player['room'] = room_code
		return jsonify({"roomCode": room_code}), 200
	return "Player already in a room", 400

@app.route('/auth/42/callback', methods=['POST'])
def auth_callback():
	code = request.args.get('code')
	token_url = 'https://api.intra.42.fr/oauth/token'
	with open('API_DONT_PUSH.json', 'r') as file:
		api = json.load(file)
	client_id = api[0]['client_id']
	client_secret = api[0]['client_secret']
	redirect_uri = 'http://127.0.0.1:5000/confirm_token'
	params = {
		'grant_type': 'authorization_code',
		'client_id': client_id,
		'client_secret': client_secret,
		'code': code,
		'redirect_uri': redirect_uri
	}
	response = requests.post(token_url, data=params)
	if response.ok:
		access_token = response.json()['access_token']
		response = requests.get('https://api.intra.42.fr/v2/me', headers={'Authorization': f'Bearer {access_token}'}).json()
		payload = {"userId": response['login'], "image": response['image']['versions']['small']}
		session['user_info'] = payload
		client.login_username(response['login'])
		return payload, 200
	else:
		return 'Token exchange failed', 400

@app.route('/get_user_info')
def get_user_info():
	user_info = session.get('user_info')
	print(user_info)
	if user_info:
		return user_info, 200
	else:
		return 'User not found.', 404

@app.route('/player_leave_room')
def	player_leave_room():
	user = request.args['player']
	room_code = request.args['roomCode']
	client.player_leave_room(room_code, user)

@app.route('/match/<roomCode>', methods=['GET'])
def match(roomCode):
	return render_template("match.html", roomCode=roomCode)

@app.route("/confirm_token")
def confirm_token():
	return render_template("confirm_token.html")

@app.route("/")
def render_page():
	user_info = session.get('user_info')
	if user_info:
		return render_template("index.html")
	else:
		return render_template("login.html")

@app.route("/home")
def render_index_page():
	user_info = session.get('user_info')
	if user_info:
		return render_template("index.html")
	else:
		return render_template("login.html")

@app.route('/<path:filename>')
def serve_file(filename):
	return send_from_directory('.', filename)

if __name__ == "__main__":
	socketio.run(app, host='0.0.0.0')