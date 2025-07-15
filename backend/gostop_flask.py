#!/usr/bin/env python3

import enum
from flask import Flask, request, jsonify
from flask_cors import CORS
from gostop_database import GostopDB

class GostopFlask():
    def __init__(self):
        self.gostop_db = GostopDB()
        self.app = Flask(__name__)

        CORS(self.app)

        self.register_routes()

    def update_point_balances(self, game_data, player_data):
        win_points = None
        winner_id = None
        sell_addition = 0
        for row in game_data:
            if row.get("event_type") == "WIN":
                win_points = row.get("points")
                winner_id = row.get("player_id")

            if row.get("event_type") == "SELL":
                sell_addition = row.get("points")

        if win_points is None:
            return

        winner_tally = 0
        for row in game_data:
            if row.get("event_type") == "LOSS_MULTIPLIER":
                player_id = row.get("player_id")
                multiplier = row.get("points")
                for player in player_data:
                    if player.get("role") == "SELLER":
                        continue

                    if player.get("player_id") == player_id:
                        update = (win_points + sell_addition) * multiplier
                        player["point_delta"] -= update
                        winner_tally += update
                        break

        for player in player_data:
            if player.get("player_id") == winner_id:
                player["point_delta"] += winner_tally
                break

    def update_frl_balances(self, game_data, player_data):
        for row in game_data:
            if row.get("event_type") == "FIRST_ROUND_LOCK":
                lock_player = row.get("player_id")
                lock_player_idx = None
                for idx, player in enumerate(player_data):
                    if player.get("player_id") == lock_player:
                        lock_player_idx = idx
                        break

                for player in player_data:
                    if player.get("role") == "SELLER" or player.get("player_id") == lock_player:
                        continue

                    # Always 0 sum
                    player["point_delta"] -= 5
                    player_data[lock_player_idx]["point_delta"] += 5
        
    def update_seller_balances(self, game_data, player_data):
        sell_points = None
        seller_id = None
        for row in game_data:
            if row.get("event_type") == "SELL":
                sell_points = row.get("points")
                seller_id = row.get("player_id")
                break

        # No seller to update with
        if seller_id is None:
            return

        seller_player_idx = None
        for idx, player in enumerate(player_data):
            if player.get("player_id") == seller_id:
                seller_player_idx = idx
                break

        for player in player_data:
            # Dealer and seller arent updated here
            if player.get("role") == "DEALER" or player.get("role") == "SELLER":
                continue

            # 0 sum game
            player_data[seller_player_idx]["point_delta"] += sell_points
            player["point_delta"] -= sell_points

    def update_balances(self, game_data, player_data):
        self.update_seller_balances(game_data, player_data)
        self.update_frl_balances(game_data, player_data)
        self.update_point_balances(game_data, player_data)

        # Update the players balance
        for player in player_data:
            player["balance"] += player["point_delta"]

    def register_routes(self):
        @self.app.route("/points_events/<int:role_id>", methods=["POST"])
        def add_points_event(role_id):
            data = request.get_json()
            print(data)
            event_type = data.get("event_type")
            points = data.get("points")

            points_event_id = self.gostop_db._insert_new_points_event(role_id, event_type, points)

            return jsonify(points_event_id), 201

        @self.app.route("/roles/<int:game_id>", methods=["POST"])
        def add_role(game_id):
            data = request.get_json()
            print(data)
            player_id = data.get("player_id")
            role = data.get("role")

            role_id = self.gostop_db._insert_new_role(game_id, player_id, role)

            return jsonify(role_id), 201

        @self.app.route("/games/<int:game_id>", methods=["DELETE"])
        def delete_game(game_id):
            points_game = self.gostop_db._get_game_players(game_id)
            if points_game is None:
                return jsonify({"error": "Unknown game id"}), 400

            # Undo the point delta
            for points in points_game:
                new_balance = points["balance"] - points["point_delta"]
                self.gostop_db._update_player_balance(points["player_id"], new_balance)

            self.gostop_db._delete_game(game_id)
            return "", 200
        
        @self.app.route("/games/<int:game_id>", methods=["GET"])
        def get_game(game_id):
            game_data = self.gostop_db._get_game(game_id)
            player_data = self.gostop_db._get_game_players(game_id)
            if game_data is None or player_data is None:
                return jsonify({"error": "No player or game data"}), 400

            self.update_balances(game_data, player_data)

            for player in player_data:
                self.gostop_db._update_player_balance(player.get("player_id"), player.get("balance"))
                self.gostop_db._update_role_point_delta(player.get("role_id"), player.get("point_delta"))

            game_display_data = self.gostop_db._get_games_layout(game_id)

            return jsonify(game_display_data), 201

        @self.app.route("/games", methods=["GET"])
        def get_games():
            games = self.gostop_db._get_games_layout()
            if games is None:
                return jsonify([])

            return jsonify(games), 201

        @self.app.route("/games", methods=["POST"])
        def add_game():
            data = request.get_json()
            winner_id = data.get("winner_id")

            game_id = self.gostop_db._insert_new_game(winner_id)

            return jsonify(game_id), 201

        @self.app.route("/players/<int:player_id>", methods=["DELETE"])
        def delete_player(player_id):
            player = self.gostop_db._get_player(id=player_id)
            if player is None:
                return jsonify({"error": "Delete failed: Unknown player id"}), 400

            if player[0]["balance"] != 0:
                return jsonify({"error": "Delete failed: Un-paid balance"}), 409

            self.gostop_db._delete_player(player_id)
            return "", 200

        @self.app.route("/players/<int:player_id>", methods=["PATCH"])
        def update_player(player_id):
            data = request.get_json()
            print(data)
            return "", 200

        @self.app.route("/players", methods=["GET"])
        def get_players():
            players = self.gostop_db._get_player()
            if players is None:
                return jsonify([])

            return jsonify(players)

        @self.app.route("/players", methods=["POST"])
        def add_player():
            data = request.get_json()
            name = data.get("name").strip()
            username = data.get("username").strip()
            if not name or not username:
                return jsonify({"error": "Player name is required"}), 400

            # Check to see if player already exists
            player = self.gostop_db._get_player(username=username)
            if player is not None:
                return jsonify({"error": "Username taken"}), 409
            
            # insert as new player
            player_id = self.gostop_db._insert_new_player(name, username)

            # get players data and return it to the gui
            player = self.gostop_db._get_player(id=player_id)
            if player is not None:
                return jsonify(player[0]), 201

            # Should not be possible
            return jsonify([]), 404


    def run(self, host="0.0.0.0", port=8000, debug=True):
        self.app.run(host=host, port=port, debug=debug)


if __name__ == "__main__":
    api = GostopFlask()
    api.run()
