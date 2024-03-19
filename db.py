from pymongo import MongoClient
import json

class	UserDB:
	def __init__(self, connection_string):
		self.client = MongoClient(connection_string, tls=True, tlsAllowInvalidCertificates=True)
		self.db = self.client.users_db.users
		self.rooms = self.client.rooms.room

	def	login_username(self, username):
		user = self.db.find_one({"username": username})
		if not user:
			self.add_user(username=username)

	def	add_user(self, username):
		self.db.insert_one({
			"username": username,
			"stats": {
				"elo": 500,
				"games": 0,
				"wins": 0,
				"losses": 0
			},
			"room": None
		})

	def create_room(self, room_creator, room_code):
		self.rooms.insert_one({
			"player_1": room_creator,
			"room_code": room_code,
			"player_2": None,
			"status": "Idle"
		})

	def player_leave_room(self, room_code, username):
		room = self.get_room(room_code)
		if room['player_1'] == username:
			room['player_1'] = None
		elif room['player_2'] == username:
			room['player_2'] = None
		user = self.get_user(username)
		user['room'] = None
		if room['player_1'] == None and room['player_2'] == None:
			self.delete_room(room_code)

	def delete_room(self, room_code):
		self.rooms.delete_one(self.get_room(room_code))

	def remove_user(self, user):
		self.db.delete_one(user)

	def get_user(self, username):
		return self.db.find_one({"username": username})

	def get_room(self, room_code):
		return self.rooms.find_one({"room_code": room_code})

	def update_user(self, username, update):
		result = self.db.update_one({"username": username}, update)
		return result.modified_count

	def update_room(self, room_code, update):
		result = self.rooms.update_one({"room_code": room_code}, update)
		return result.modified_count
