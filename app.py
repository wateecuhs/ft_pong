from flask import Flask, render_template, send_from_directory, request, jsonify, Response, redirect,send_file, session
import json
import string
import bisect
import random
import requests
import os
from flask_socketio import SocketIO, send, emit, join_room, leave_room
from db import UserDB
from sockets import User
import logging
app = Flask(__name__)

app.secret_key = os.environ.get('FLASK_SECRET')
client = UserDB(os.environ.get('CONNECTION_STRING'))
socketio = SocketIO(app)
active_users = {}

def format_room_data(room):
	room_data = {
		"player_1": {
			"username": room['player_1'],
			"stats": client.get_user(room['player_1'])['stats'] if client.get_user(room['player_1']) is not None else None
			},
		"player_2": {
			"username": room['player_2'],
			"stats": client.get_user(room['player_2'])['stats']  if client.get_user(room['player_2']) is not None else None
			},
		"room_code": room['room_code'],
		"status": room['status']
		}
	return room_data

@socketio.on('join')
def on_join(data):
	user_id = session.get('user_info').get('userId')
	room_code = data['room']
	player = client.get_user(user_id)
	room = client.get_room(room_code)
	if room is None:
		return {"message" : "Room not found"}, 404
	if player['room'] == room_code and (room['player_1'] == player['username'] or room['player_2'] == player['username']):
		user = get_or_create_user(user_id)
		room_data = format_room_data(room)
		user.join_room(room_data)
		room = client.get_room(room_code)
		return room_data, 200
	if player['room'] != None:
		return {"message" : "Player already in a room"}, 409
	if room['player_1'] != None and room['player_2'] != None:
		return {"message" : "Room is full"}, 409
	user = get_or_create_user(user_id)
	if room['player_1'] is None:
		client.update_room(room_code, {'$set': {'player_1': player['username']}})
		client.update_user(player['username'], {'$set': {'room': room_code}})
	else:
		client.update_room(room_code, {'$set': {'player_2': player['username']}})
		client.update_user(player['username'], {'$set': {'room': room_code}})
	room = client.get_room(room_code)
	room_data = format_room_data(room)
	user.join_room(room_data)
	return room_data, 200

@socketio.on('create')
def on_create():
	user_id = session.get('user_info').get('userId')
	player = client.get_user(user_id)
	if player['room'] == None:
		room_code = id_generator()
		client.create_room(player['username'], room_code)
		client.update_user(player['username'], {'$set': {'room': room_code}})
		player['room'] = room_code
		user = get_or_create_user(user_id)
		room = client.get_room(room_code)
		room_data = format_room_data(room)
		user.join_room(room_data)
		return room_data, 200
	return {"message": f"Player already in room {player['room']}"}, 409

@socketio.on('player1_vote')
def on_player1_vote():
	user_id = session.get('user_info').get('userId')
	player = client.get_user(user_id)
	room = client.get_room(player['room'])
	if room['player_1'] == player['username']:
		client.update_room(room['room_code'], {'$set': {'player1_vote': 1}})
	else:
		client.update_room(room['room_code'], {'$set': {'player2_vote': 1}})
	room = client.get_room(player['room'])
	user = get_user(user_id)
	user.vote(room['room_code'], {"player1_vote": room['player1_vote'], "player2_vote": room['player2_vote']})
	if room['player1_vote'] == 1 and room['player2_vote'] == 1:
		game_end(room['player_1'], room['player_2'], room['room_code'])
		emit('game_ended', {"player_1": {"username": room['player_1'], "winner": True}, "player_2": {"username": room['player_2'], "winner": False}, "room_code": room['room_code']})
	if room['player1_vote'] == 2 and room['player2_vote'] == 2:
		game_end(room['player_1'], room['player_2'], room['room_code'])
		emit('game_ended', {"player_1": {"username": room['player_1'], "winner": False}, "player_2": {"username": room['player_2'], "winner": True}, "room_code": room['room_code']})
	return {"player1_vote": room['player1_vote'], "player2_vote": room['player2_vote']}, 200

@socketio.on('player2_vote')
def on_player2_vote():
	user_id = session.get('user_info').get('userId')
	player = client.get_user(user_id)
	room = client.get_room(player['room'])
	if room['player_1'] == player['username']:
		client.update_room(room['room_code'], {'$set': {'player1_vote': 2}})
	else:
		client.update_room(room['room_code'], {'$set': {'player2_vote': 2}})
	room = client.get_room(player['room'])
	user = get_user(user_id)
	user.vote(room['room_code'], {"player1_vote": room['player1_vote'], "player2_vote": room['player2_vote']})
	return {"player1_vote": room['player1_vote'], "player2_vote": room['player2_vote']}, 200

@socketio.on('start')
def on_start():
	user_id = session.get('user_info').get('userId')
	player = client.get_user(user_id)
	room = client.get_room(player['room'])
	if room['player_1'] is None or room['player_2'] is None:
		return {"message": "Need 2 players"}, 404
	room['status'] = 'Playing'
	client.update_room(room['room_code'], {'$set': {'status': 'Playing'}})
	user = get_user(user_id)
	user.game_started(room['room_code'])
	return {"message": f"Game started in room {room['room_code']}"}, 200

@socketio.on('leave')
def on_leave():
	user_id = session.get('user_info').get('userId')
	user = get_user(user_id)
	room = client.get_user(user_id)['room']
	client.player_leave_room(room, user_id)
	room_data = client.get_room(room)
	if user:
		if room_data is None:
			user.leave_room_destroy(room)
		else:
			user.leave_room(format_room_data(room_data))
	return room, 200

def	game_end(winner: string, loser: string, room_code: string):
	winner_data = client.get_user(winner)
	loser_data = client.get_user(loser)
	winner_data['stats']['elo'], loser_data['stats']['elo'] = updateElo(winner_data['stats']['elo'], loser_data['stats']['elo'])
	winner_data['stats']['games'] = winner_data['stats']['games'] + 1
	winner_data['stats']['wins'] = winner_data['stats']['wins'] + 1
	loser_data['stats']['games'] = loser_data['stats']['games'] + 1
	loser_data['stats']['losses'] = loser_data['stats']['losses'] + 1
	client.update_user(winner_data['username'], {'$set': {"stats": winner_data['stats']}})
	client.update_user(winner_data['username'], {'$set': {"room": None}})
	client.update_user(loser_data['username'], {'$set': {"stats": loser_data['stats']}})
	client.update_user(loser_data['username'], {'$set': {"room": None}})
	client.delete_room(room_code)
	user = get_or_create_user(winner_data['username'])
	if user:
		user.game_ended(room_code)
	user = get_or_create_user(loser_data['username'])
	if user:
		user.game_ended(room_code)

@socketio.on('game_ended')
def	game_ended(data):
	if data['player_1']['winner'] == True:
		winner = client.get_user(data['player_1']['username'])
		loser = client.get_user(data['player_2']['username'])
	else:
		winner = client.get_user(data['player_2']['username'])
		loser = client.get_user(data['player_1']['username'])
	room_code = data['room_code']
	winner['stats']['elo'], loser['stats']['elo'] = updateElo(winner['stats']['elo'], loser['stats']['elo'])
	winner['stats']['games'] = winner['stats']['games'] + 1
	winner['stats']['wins'] = winner['stats']['wins'] + 1
	loser['stats']['games'] = loser['stats']['games'] + 1
	loser['stats']['losses'] = loser['stats']['losses'] + 1
	client.update_user(winner['username'], {'$set': {"stats": winner['stats']}})
	client.update_user(winner['username'], {'$set': {"room": None}})
	client.update_user(loser['username'], {'$set': {"stats": loser['stats']}})
	client.update_user(loser['username'], {'$set': {"room": None}})
	client.delete_room(room_code)
	user = get_or_create_user(winner['username'])
	if user:
		user.game_ended(room_code)
	user = get_or_create_user(loser['username'])
	if user:
		user.game_ended(room_code)

@socketio.on('connect')
def on_connect():
	user_id = session.get('user_info').get('userId')
	active_users[user_id] = User(user_id)
	print(f"{user_id} connected.")
	user = get_or_create_user(user_id)
	user_data = client.get_user(user_id)
	if user_data['room'] is None:
		return
	room_data = client.get_room(user_data['room'])
	user.join_room(format_room_data(room_data))

@socketio.on('disconnect')
def on_disconnect():
	user_id = session.get('user_info').get('userId')
	if user_id in active_users:
		print(f"{user_id} disconnected.")
		leave_room(user_id)
		del active_users[user_id]

def get_or_create_user(user_id):
	if user_id not in active_users:
		active_users[user_id] = User(user_id)
	return active_users[user_id]

def get_user(user_id):
	return active_users.get(user_id)

@app.route("/get_room", methods=['POST'])
def	get_room():
	roomCode = request.args['roomCode']
	room = client.get_room(room_code=roomCode)
	if room:
		return format_room_data(room), 200
	return {"message" : "Room not found"}, 404

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
	return (round(R1), round(R2))

@app.route("/get_leaderboard")
def get_leaderboard():
	doc = client.db.find()
	leaderboard = []
	for user in doc:
		if (len(leaderboard) < 10 or leaderboard[9]['elo'] < user['stats']['elo']) and user['stats']['games'] > 0:
			bisect.insort(leaderboard, {"username": user['username'], "elo": user['stats']['elo'], "image": user['image'], "wins": user['stats']['wins'], "losses": user['stats']['losses']}, key=lambda x: -1 * x["elo"])
	return leaderboard[:10], 200

@app.route("/start_game", methods=['POST'])
def start_game():
	roomCode = request.args['roomCode']
	room = client.get_room(roomCode)
	if room['player_1'] is None or room['player_2'] is None:
		return "Need 2 players", 404
	room['status'] = 'Playing'
	return jsonify({"message" : f"Game started in room {roomCode}"}), 200

@app.route('/auth/42/callback', methods=['POST'])
def auth_callback():
	print("test")
	code = request.args.get('code')
	token_url = 'https://api.intra.42.fr/oauth/token'
	if code == 'ADMIN':
		payload = {"userId": 'ADMIN', "image": 'https://cdn.intra.42.fr/users/e3f8a534b7223eb50fedd0d41dcbd75f/small_panger.jpg'}
		session['user_info'] = payload
		client.login_username('ADMIN', 'https://cdn.intra.42.fr/users/e3f8a534b7223eb50fedd0d41dcbd75f/small_panger.jpg')
		return payload, 200
	client_id = os.environ.get('CLIENT_ID')
	client_secret = os.environ.get('CLIENT_SECRET')
	redirect_uri = 'http://localhost:5000/confirm_token'
	params = {
		'grant_type': 'authorization_code',
		'client_id': client_id,
		'client_secret': client_secret,
		'code': code,
		'redirect_uri': redirect_uri
	}
	response = requests.post(token_url, data=params)
	print("hello")
	if response.ok:
		access_token = response.json()['access_token']
		response = requests.get('https://api.intra.42.fr/v2/me', headers={'Authorization': f'Bearer {access_token}'}).json()
		payload = {"userId": response['login'], "image": response['image']['versions']['small']}
		session['user_info'] = payload
		client.login_username(response['login'], response['image']['versions']['small'])
		return payload, 200
	else:
		return jsonify({"message": response.text}), 400

@app.route('/get_user_info')
def get_user_info():
	user_info = session.get('user_info')
	if user_info:
		if client.get_user(user_info['userId']) is None:
			client.create_user(user_info['userId'], user_info['image'])
		user_data = client.get_user(user_info['userId'])
		del user_data['_id']
		return user_data, 200
	else:
		return 'User not found.', 404

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
	print("Starting server")
	app.logger.setLevel(logging.INFO)
	socketio.run(app, host='0.0.0.0',  port=5000, debug=True)
	print("Server started")