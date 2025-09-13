#!/usr/bin/env python3

from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from gostop_database import GostopDB
import jwt
import bcrypt
import datetime
from functools import wraps
import os
import pandas as pd
import matplotlib.pyplot as plt
import io

ALGORITHM = "HS256"
RAW_PASSWORD = os.getenv("PASSWORD", "admin1234")
ACCESS_SECRET_KEY = os.getenv("ACCESS_SECRET_KEY", "asdfalavih23tu8ahlkasjdkf")
REFRESH_SECRET_KEY = os.getenv("REFRESH_SECRET_KEY", "12385691qweljalksdfakasfdlf")

PASSWORD = bcrypt.hashpw(RAW_PASSWORD.encode('utf-8'), bcrypt.gensalt())

# Middleware to protect routes
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(" ")[1]

        if not token:
            return jsonify({"message": "Token is missing!"}), 401

        try:
            data = jwt.decode(token, ACCESS_SECRET_KEY, algorithms=[ALGORITHM])
            print(data)
        except jwt.ExpiredSignatureError:
            return jsonify({"message": "Token has expired"}), 401
        except Exception as e:
            return jsonify({"message": "Invalid token"}), 401

        return f(*args, **kwargs)

    return decorated

def generate_tokens(username):
    access_token = jwt.encode({
        'username': username,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=1)
    }, ACCESS_SECRET_KEY, algorithm=ALGORITHM)

    refresh_token = jwt.encode({
        'username': username,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }, REFRESH_SECRET_KEY, algorithm=ALGORITHM)

    return access_token, refresh_token

class GostopFlask():
    def __init__(self):
        self.gostop_db = GostopDB()
        self.app = Flask(__name__)

        CORS(self.app, supports_credentials=True, 
                origins=["http://localhost:5173", "https://tyler-dubuke.com"])

        self.register_routes()

    def _update_point_balances(self, game_data, player_data):
        """
        Update the total points, add the sell amount to the winners total and subtract the win total times
        the multiplier
        """
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

    def _update_frl_balances(self, game_data, player_data):
        """
        Update the point deltas from the first round lock event, subtract 5 points from all players
        that arent a seller and add them to the first round lock players totals
        """
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
        
    def _update_seller_balances(self, game_data, player_data):
        """
        Update the point deltas with all pre-game sells, subtract the points from the non-dealer
        players and add that to the dealers point total
        """
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

    def _calculate_point_deltas(self, game_data, player_data):
        self._update_seller_balances(game_data, player_data)
        self._update_frl_balances(game_data, player_data)
        self._update_point_balances(game_data, player_data)

        # Update the players balance
        for player in player_data:
            player["balance"] += player["point_delta"]

    def _update_balances(self, game_id):
        """
        Calculate all of the point deltas and update the balances of a specific game
        """
        game_data = self.gostop_db._get_game_data(game_id)
        player_data = self.gostop_db._get_game_players(game_id)
        if game_data is None or player_data is None:
            return

        self._calculate_point_deltas(game_data, player_data)

        for player in player_data:
            self.gostop_db._update_player_balance(player.get("player_id"), player.get("balance"))
            self.gostop_db._update_role_point_delta(player.get("role_id"), player.get("point_delta"))

    def _clear_deltas_and_balances(self):
        """
        Clear all the balances and point deltas from the database
        """
        players = self.gostop_db._get_player()
        if players is not None:
            for player in players:
                print("Player: ", player)
                self.gostop_db._update_player_balance(player.get("id"), 0)

        roles = self.gostop_db._get_role()
        if roles is not None:
            for role in roles:
                print("Role: ", role)
                self.gostop_db._update_role_point_delta(role.get("id"), 0)

    def register_routes(self):
        @self.app.route("/refresh", methods=["POST"])
        def refresh():
            """
            Refresh the access tokens
            """
            token = request.cookies.get("refresh_token")
            print(request)

            if not token:
                return jsonify({"message": "Refresh token is missing!"}), 401

            try:
                data = jwt.decode(token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
                username = data['username']
            except jwt.ExpiredSignatureError:
                return jsonify({"message": "Refresh token has expired"}), 401
            except Exception as e:
                print("Refresh decode error:", e)
                return jsonify({"message": "Invalid refresh token"}), 401

            # Generate new tokens
            access_token, refresh_token = generate_tokens(username)

            response = jsonify({ "access_token": access_token })
            response.set_cookie("refresh_token", refresh_token, httponly=False, secure=False, samesite="Lax")

            return response, 200

        @self.app.route("/login", methods=["POST"])
        def login():
            """
            Authenticate and send a token to submit updates
            """
            auth = request.get_json()
            if not auth or not auth.get("password") or not auth.get("username"):
                return jsonify({"message": "Username and password required"}), 400

            if not bcrypt.checkpw(auth.get("password").encode('utf-8'), PASSWORD):
                return jsonify({"message": "Invalid password"}), 401

            access_token, refresh_token = generate_tokens(auth.get("username"))

            response = jsonify({ "access_token": access_token })
            response.set_cookie("refresh_token", refresh_token, httponly=False, secure=False, samesite="Lax")

            return response, 200

        @self.app.route("/stats", methods=["GET"])
        def get_stats():
            """
            Get database stats
            """
            deal_win_per = self.gostop_db._get_win_deal_data().get("dealer_win_percentage")
            player_games = self.gostop_db._get_player_games_played()
            return jsonify({"dealer_win_percentage": deal_win_per, "players": player_games}), 201

        @self.app.route("/player.svg", methods=["GET"])
        def get_player_svg():
            """
            Get SVG of player score over time, handling multiple events in the same day,
            and normalize game IDs so there are no gaps in the x-axis.
            """
            player_data = self.gostop_db._get_player_over_time()
            df = pd.DataFrame(player_data)

            # Sort globally by game_id
            df = df.sort_values("game_id").reset_index(drop=True)

            # Create a mapping from actual game_id to a normalized sequential ID
            unique_game_ids = df["game_id"].unique()
            id_mapping = {old_id: new_id for new_id, old_id in enumerate(unique_game_ids, start=0)}

            # Apply mapping
            df["normalized_game_id"] = df["game_id"].map(id_mapping)

            # normalize game timestamps
            df["game_timestamp"] = pd.to_datetime(df["game_timestamp"])

            plt.figure(figsize=(15, 10))
            gameid_axis = plt.gca()

            for player, group in df.groupby("player_name"):
                group = group.sort_values("normalized_game_id")

                # Cumulative sum of points
                group["cumulative_points"] = group["point_delta"].cumsum()

                gameid_axis.plot(group["normalized_game_id"], group["cumulative_points"], marker="o", label=player)

            plt.title("Player Points Over Time")
            gameid_axis.set_xlabel("Game")
            plt.ylabel("Cumulative Points")
            plt.legend()
            plt.grid(True)


            date_axis = gameid_axis.twiny() # "twin" the y axis creating a secondary x axis
            date_axis.set_xlim(gameid_axis.get_xlim()) # set the range of secondary x axis
            day_starts = df.groupby(df["game_timestamp"].dt.date)["normalized_game_id"].min() # all of the start of days
            date_axis.set_xticks(day_starts.values) # set tick at each day start
            date_axis.set_xticklabels([d.strftime("%Y-%m-%d") for d in day_starts.index], rotation=45) # format the date nicely and print on the tick
            date_axis.set_xlabel("Date (GMT)")

            # Save to in-memory SVG
            svg_io = io.StringIO()
            plt.savefig(svg_io, format="svg", bbox_inches="tight")
            plt.close()

            return Response(svg_io.getvalue(), mimetype="image/svg+xml")

        @self.app.route("/num_games", methods=["GET"])
        def get_num_game():
            """
            Get the number of games from the database
            """
            num_game = self.gostop_db._get_num_games()
            if num_game is None:
                return jsonify({"error": "Failed query"}), 400

            return jsonify(num_game[0].get("total_games")), 200

        @self.app.route("/games/<int:game_id>", methods=["DELETE"])
        @token_required
        def delete_game(game_id):
            """
            Delete a game from the database
            """
            points_game = self.gostop_db._get_game_players(game_id)
            if points_game is None:
                return jsonify({"error": "Unknown game id"}), 400

            # Undo the point delta
            for points in points_game:
                new_balance = points["balance"] - points["point_delta"]
                self.gostop_db._update_player_balance(points["player_id"], new_balance)

            self.gostop_db._delete_game(game_id)
            return "", 200

        @self.app.route("/update", methods=["PATCH"])
        @token_required
        def update_balances():
            """
            0 out all the balances and point deltas for all players and recalculate everything
            """
            self._clear_deltas_and_balances()

            games = self.gostop_db._get_game()
            if games is not None:
                for game in games:
                    self._update_balances(game.get("id"))

            return jsonify(""), 200

        @self.app.route("/games", methods=["GET"])
        def get_games():
            """
            Get a nice display struct with all the games in it
            """
            games = self.gostop_db._get_games_layout()
            if games is None:
                return jsonify([])

            return jsonify(games), 201

        @self.app.route("/games/batch", methods=["POST"])
        @token_required
        def add_game():
            """
            Add a game to the database
            """
            data = request.get_json()
            
            winner_id = data.get("winner_id")
            game_id = self.gostop_db._insert_new_game(winner_id)

            players = data.get("players")
            for player in players:
                id = player.get("id")
                role = player.get("role")

                role_id = self.gostop_db._insert_new_role(game_id, id, role)
                for event in player.get("points_events"):
                    event_type = event.get("event_type")
                    points = event.get("points")
                    self.gostop_db._insert_new_points_event(role_id, event_type, points)

            # Update all the game balances
            self._update_balances(game_id)

            game_display_data = self.gostop_db._get_games_layout(game_id)
            if game_display_data is None:
                return jsonify([])

            return jsonify(game_display_data), 201

        @self.app.route("/players/<int:player_id>", methods=["DELETE"])
        @token_required
        def delete_player(player_id):
            """
            Delete a player from the databse if they have a 0 balance ONLY
            """
            player = self.gostop_db._get_player(id=player_id)
            if player is None:
                return jsonify({"error": "Delete failed: Unknown player id"}), 400

            if player[0]["balance"] != 0:
                return jsonify({"error": "Delete failed: Un-paid balance"}), 409

            self.gostop_db._delete_player(player_id)
            return "", 200

        @self.app.route("/players/<int:player_id>", methods=["PATCH"])
        @token_required
        def update_player(player_id):
            data = request.get_json()
            return "", 200

        @self.app.route("/players", methods=["GET"])
        def get_players():
            players = self.gostop_db._get_player()
            if players is None:
                return jsonify([])

            return jsonify(players)

        @self.app.route("/players", methods=["POST"])
        @token_required
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

api = GostopFlask()
app = api.app  # This is what Gunicorn needs
