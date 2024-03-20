from flask_socketio import SocketIO, join_room, leave_room, emit

class User:
	def __init__(self, user_id):
		self.user_id = user_id
		self.rooms = set()

	def join_room(self, room):
		self.rooms.add(room['room_code'])
		join_room(room['room_code'])
		emit('user_joined', room, room=room['room_code'], include_self=False)
		print(f"User {self.user_id} joined room: {room['room_code']}")

	def	leave_room(self, room):
		print(room)
		self.rooms.discard(room['room_code'])
		emit('user_left', room, room=room['room_code'], include_self=False)
		leave_room(room['room_code'])
		print(f"User {self.user_id} left room: {room['room_code']}")

	def	leave_room_destroy(self, room_code):
		print(room_code)
		self.rooms.discard(room_code)
		leave_room(room_code)
		print(f"User {self.user_id} left room: {room_code}")

	def game_ended(self, room_code):
		print(room_code)
		self.rooms.discard(room_code)
		emit('game_ended', room=room_code, include_self=False)
		leave_room(room_code)
		print(f"User {self.user_id} finished a match in room: {room_code}")
