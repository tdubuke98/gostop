#!/usr/bin/env python3

import json
import sqlite3

# =============================================================================
# Globals.
# =============================================================================

DEFAULT_DB = ".data.DEFAULT.db"
sql_statements = [ 
    """CREATE TABLE IF NOT EXISTS players (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            balance INTEGER NOT NULL,
            name text NOT NULL,
            username text NOT NULL,
            password text,
            is_admin INTEGER NOT NULL DEFAULT 0
        );""",

    """CREATE TABLE IF NOT EXISTS games (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            winner_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (winner_id) REFERENCES players(id) ON DELETE CASCADE
        );""",

    """CREATE TABLE IF NOT EXISTS roles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            game_id INTEGER NOT NULL,
            player_id INTEGER NOT NULL,
            role text NOT NULL,
            point_delta INTEGER NOT NULL,
            FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
            FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
        );""",

    """CREATE TABLE IF NOT EXISTS points_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            role_id INTEGER NOT NULL,
            event_type text NOT NULL,
            points INTEGER NOT NULL,
            FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
        );""",
]

class GostopDB():

    def __init__(self):
        self.db_con = sqlite3.connect(DEFAULT_DB, check_same_thread=False)
        self.db_con.row_factory = sqlite3.Row

        cur = self.db_con.cursor()
        cur.execute("PRAGMA foreign_keys = ON;")

        for statement in sql_statements:
            cur.execute(statement)

        self.db_con.commit()

    def _insert_new_points_event(self, role_id, event_type, points):
        """
        Insert a new row into points_events table
        """

        cmd = ''' INSERT INTO points_events(role_id, event_type, points)
                  VALUES(?,?,?) '''

        cur = self.db_con.cursor()
        cur.execute(cmd, (role_id, event_type, points))

        self.db_con.commit()

        return cur.lastrowid

    def _get_role(self, role_id=None):
        """
        Get a role or all roles from the database
        """
        cur = self.db_con.cursor()

        if role_id is None:
            cmd = ''' SELECT * FROM roles '''
            res = cur.execute(cmd)
        else:
            cmd = ''' SELECT * FROM roles WHERE id=? '''
            res = cur.execute(cmd, (role_id, ))

        r_obj = res.fetchall()
        role_dict = [dict(r) for r in r_obj]
        
        if len(role_dict) == 0:
            return None

        return role_dict

    def _insert_new_role(self, game_id, player_id, role):
        """
        Insert a new row into players_games
        """

        cmd = ''' INSERT INTO roles(game_id, player_id, role, point_delta)
                  VALUES(?,?,?,?) '''

        cur = self.db_con.cursor()
        cur.execute(cmd, (game_id, player_id, role, 0))

        self.db_con.commit()

        return cur.lastrowid

    def _insert_new_player(self, name, username):
        """
        Insert a new player into the players table
        """

        cmd = ''' INSERT INTO players(name, username, balance)
                  VALUES(?,?,?) '''

        cur = self.db_con.cursor()
        cur.execute(cmd, (name, username, 0))

        self.db_con.commit()

        return cur.lastrowid

    def _insert_new_game(self, winner_id):
        """
        Insert new game into game database
        """

        cmd = ''' INSERT INTO games(winner_id)
                  VALUES(?) '''
        
        cur = self.db_con.cursor()
        cur.execute(cmd, (winner_id, ))

        self.db_con.commit()

        return cur.lastrowid

    def _update_role_point_delta(self, role_id, new_point_delta):
        """
        Update the point delta for a specific role
        """

        cmd = ''' UPDATE roles 
                  SET point_delta = ?
                  WHERE id=? '''

        cur = self.db_con.cursor()
        cur.execute(cmd, (new_point_delta, role_id))

        self.db_con.commit()

    def _update_player_balance(self, player_id, new_balance):
        """
        Update the balance of a specific player
        """
        cmd = ''' UPDATE players 
                  SET balance = ?
                  WHERE id=? '''

        cur = self.db_con.cursor()
        cur.execute(cmd, (new_balance, player_id))

        self.db_con.commit()

    def _get_game_players(self, game_id):
        """
        Get the information about a specific game by id
        """

        get_cmd = ''' SELECT player_id, roles.id AS role_id, role, balance, point_delta
                      FROM roles
                      JOIN players ON players.id = roles.player_id
                      WHERE roles.game_id=? '''

        cur = self.db_con.cursor()
        res = cur.execute(get_cmd, (game_id, ))
        
        g_obj = res.fetchall()
        game_dict = [dict(g) for g in g_obj]
        if len(game_dict) == 0:
            return None

        return game_dict

    def _get_games_layout(self, game_id=None):
        """
        Get the last games
        """
        cur = self.db_con.cursor()

        if game_id is None:
            cmd = '''SELECT 
                        g.id AS game_id,
                        winner.name AS winner_name,
                        json_group_array(
                            json_object(
                                'player_name', p.name,
                                'role', r.role,
                                'point_delta', r.point_delta
                            )
                        ) AS players
                    FROM games g
                    JOIN players winner ON g.winner_id = winner.id
                    JOIN roles r ON r.game_id = g.id
                    JOIN players p ON r.player_id = p.id
                    GROUP BY g.id, winner.name
                    ORDER BY g.created_at DESC
                    LIMIT 100 '''
            res = cur.execute(cmd)
        else:
            cmd = '''SELECT 
                        g.id AS game_id,
                        winner.name AS winner_name,
                        json_group_array(
                            json_object(
                                'player_name', p.name,
                                'role', r.role,
                                'point_delta', r.point_delta
                            )
                        ) AS players
                    FROM games g
                    JOIN players winner ON g.winner_id = winner.id
                    JOIN roles r ON r.game_id = g.id
                    JOIN players p ON r.player_id = p.id
                    WHERE g.id = ?
                    GROUP BY g.id, winner.name '''
            res = cur.execute(cmd, (game_id, ))

        g_obj = res.fetchall()
        game_dict = [dict(g) for g in g_obj]
        
        for game in game_dict:
            game["players"] = json.loads(game["players"])

        if len(game_dict) == 0:
            return None

        return game_dict

    def _get_display_game(self, game_id):
        """
        Get the information about a specific game by id
        """

        cur = self.db_con.cursor()

        get_cmd = ''' SELECT player_id, name, username, point_delta
                     FROM roles
                     JOIN games ON roles.game_id = games.id
                     JOIN players ON roles.player_id = players.id
                     WHERE games.id=? '''

        res = cur.execute(get_cmd, (game_id, ))
        
        g_obj = res.fetchall()
        game_dict = [dict(g) for g in g_obj]
        if len(game_dict) == 0:
            return None

        return game_dict

    def _get_game(self, game_id=None):
        """
        Get the information about a specific game by id
        """

        cur = self.db_con.cursor()

        if game_id is None:
            get_cmd = ''' SELECT * FROM games '''
            res = cur.execute(get_cmd)
        else:
            get_cmd = ''' SELECT * FROM games WHERE id=? '''
            res = cur.execute(get_cmd, (game_id, ))
        
        g_obj = res.fetchall()
        game_dict = [dict(g) for g in g_obj]
        if len(game_dict) == 0:
            return None

        return game_dict

    def _get_win_deal_data(self):
        """
        Get the percentage where the dealer is also the winner
        """
        cur = self.db_con.cursor()

        cmd = ''' SELECT
                    ROUND(
                        CAST(SUM(CASE WHEN roles.player_id = games.winner_id THEN 1 ELSE 0 END) AS FLOAT)
                        / COUNT(*) * 100, 2) AS dealer_win_percentage
                    FROM games
                    JOIN roles ON games.id = roles.game_id
                    WHERE roles.role = 'DEALER' '''

        res = cur.execute(cmd)

        s_obj = res.fetchall()
        stats_dict = [dict(s) for s in s_obj]
        if len(stats_dict) == 0:
            return None

        return stats_dict[0]


    def _get_game_data(self, game_id):
        """
        Get the information about a specific game by id
        """

        cur = self.db_con.cursor()

        get_cmd = ''' SELECT player_id, game_id, name, username, role, event_type, points
                    FROM roles
                    JOIN games ON roles.game_id = games.id
                    JOIN players ON roles.player_id = players.id
                    JOIN points_events ON points_events.role_id = roles.id
                    WHERE games.id=? '''

        res = cur.execute(get_cmd, (game_id, ))
        
        g_obj = res.fetchall()
        game_dict = [dict(g) for g in g_obj]
        if len(game_dict) == 0:
            return None

        return game_dict

    def _delete_game(self, id):
        """
        Delete a specified game by id
        """
        cur = self.db_con.cursor()

        cmd = ''' DELETE FROM games
                  WHERE id=?'''

        cur.execute(cmd, (id, ))

        self.db_con.commit()

    def _delete_player(self, id):
        """
        Delete a specified player by id
        """
        cur = self.db_con.cursor()

        cmd = ''' DELETE FROM players
                  WHERE id=? '''

        cur.execute(cmd, (id, ))

        self.db_con.commit()

    def _get_player(self, name=None, username=None, id=None):
        """
        Get the information about a specific player by name
        """
        cur = self.db_con.cursor()

        if name is not None:
            get_cmd = ''' SELECT *
                        FROM players
                        WHERE name=? '''

            res = cur.execute(get_cmd, (name, ))
        elif id is not None:
            get_cmd = ''' SELECT *
                        FROM players
                        WHERE id=? '''

            res = cur.execute(get_cmd, (id, ))
        elif username is not None:
            get_cmd = ''' SELECT *
                        FROM players
                        WHERE username=? '''

            res = cur.execute(get_cmd, (username, ))
        else:
            get_cmd = ''' SELECT * FROM players '''

            res = cur.execute(get_cmd)

        p_obj = res.fetchall()
        players = [dict(p) for p in p_obj]

        if len(players) == 0:
            return None

        return players
