from flask import Flask, render_template, send_from_directory, request, jsonify, Response
import json
import string
import random
import datetime

app = Flask(__name__)
def id_generator():
	return ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(6))

@app.route("/join_room", methods=['POST'])
def join_room():
	user = request.args['player']
	roomCode = request.args['roomCode']
	with open('rooms.json', 'r') as file:
		rooms = json.load(file)
	for room in rooms:
		if room['roomCode'] == roomCode:
			if room['player2'] == None:
				room['player2'] = user
				with open('rooms.json', 'w') as file:
					json.dump(rooms, file, sort_keys=True, indent='\t', separators=(',', ': '))
				return jsonify({"message" : f"Player {user} joined room {roomCode}"}), 200
			else:
				return jsonify({"message" : f"Room {roomCode} is full"}), 409
	return jsonify({"message" : f"Room {roomCode} not found"}), 404

@app.route("/create_room", methods=['POST'])
def create_room():
	user = request.args['player']
	with open('rooms.json', 'r') as file:
		rooms = json.load(file)
	for room in rooms:
		if room['player1'] == user or room['player2'] == user:
			return jsonify({"message" : f"Player already in a room ({room['roomCode']})"}), 409
	roomCode = id_generator()
	rooms.append({"roomCode": roomCode, "player1": user, "player2": None})
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
	return "Player not found!"

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

@app.route("/")
def render_page():
	return render_template("index.html")\

@app.route('/<path:filename>')
def serve_file(filename):
	return send_from_directory('.', filename)

if __name__ == "__main__":
	app.run(debug=True)