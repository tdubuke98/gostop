#!/usr/bin/env python3

import sqlite3
import argparse
import cmd
import collections
import glob
import hashlib
import json
import os
import pipes
import random
import re
import readline
import shlex
import sys
import time

# =============================================================================
# Utils.
# =============================================================================

def natural_sort(itr, key=None):
    """
    Sort input alphanumerically.

    Required Args:
        itr <iterable>: Input iterable to sort.

    Optional Args:
        key <str>: Key to user in sorting.

    Returns:
        itr <iterable>: Newly sorted iterable.
    """
    convert = lambda t: int(t) if t.isdigit() else t
    alphanum_key = lambda i: [convert(c) for c in re.split('([0-9]+)', key(i) if (key) else i)]
    return sorted(itr, key=alphanum_key)

def print_table(tbl, align="right"):
    """
    Format columns and print table.

    Required Args:
        tbl <list<list>>: Input table to print, formatted as a list of lists.

    Optional Args:
        align <str>: Alignment string, supports 'left' and 'right'.
    """
    align_char = '>' if (align == "right") else '<'
    widths = [(max([len(str(row[col])) for row in tbl]) + 3) for col in range(len(tbl[0]))]
    row_template = ''.join(["{:" + align_char + str(w) + "}" for w in widths])
    for row in tbl:
        print(row_template.format(*row))

# =============================================================================
# Globals.
# =============================================================================

COLORS = collections.namedtuple("color", (
    "BLACK",    "RED",      "GREEN",    "YELLOW",   "BLUE",     "MAGENTA",  "CYAN",     "WHITE",    "RESET", ))(
    "\033[30m", "\033[31m", "\033[32m", "\033[33m", "\033[34m", "\033[35m", "\033[36m", "\033[37m", "\033[0m"
)

# Convenience functions for logging.
def LOG(msg, color=COLORS.RESET):
    sys.stdout.write("{sc}[LOG]: {m}\n{ec}".format(m=msg, sc=color, ec=COLORS.RESET))

def ERR(msg, color=COLORS.RED, exit=False):
    sys.stderr.write("{sc}[ERR]: {m}\n{ec}".format(m=msg, sc=color, ec=COLORS.RESET))
    if (exit):
        sys.exit(1)

# History file.
HISTORY_FILE = ".{n}.history".format(n=os.path.splitext(os.path.basename(__file__))[0])
HISTORY_SIZE = 1000

DEFAULT_DB = ".data.DEFAULT.db"

sql_statements = [ 
    """CREATE TABLE IF NOT EXISTS players (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            balance INTEGER NOT NULL,
            name text NOT NULL
        );""",

    """CREATE TABLE IF NOT EXISTS games (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            dealer_id INTEGER NOT NULL,
            FOREIGN KEY (dealer_id) REFERENCES players(id)
        );""",

    """CREATE TABLE IF NOT EXISTS players_game (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            game_id INTEGER NOT NULL,
            player_id INTEGER NOT NULL,
            FOREIGN KEY (game_id) REFERENCES games(id),
            FOREIGN KEY (player_id) REFERENCES players(id)
        );""",

    """CREATE TABLE IF NOT EXISTS win_points (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_game_id INTEGER NOT NULL,
            win_type text NOT NULL,
            points INTEGER NOT NULL,
            FOREIGN KEY (player_game_id) REFERENCES players_game(id)
        );""",
]

def reload_history():
    """
    Reload the command history file.
    """
    if (os.path.exists(HISTORY_FILE)):
        
        # Attempt to reload history.
        try:
            readline.read_history_file(HISTORY_FILE)

        # History file is missing header.
        except IOError:
            ERR("Unable to process history file, v2 header is being added... file={f}".format(f=HISTORY_FILE))

            # Save off history.
            history = ''
            with open(HISTORY_FILE, 'r') as fp:
                history = fp.read()

            # Touchup history file with header.
            with open(HISTORY_FILE, 'w') as fp:
                fp.write("_HiStOrY_V2_\n{h}".format(h=history))

            readline.read_history_file(HISTORY_FILE)

class Cli(cmd.Cmd):
    prompt = "Gostop >> "

    def __init__(self):
        """
        Initialize class.
        """
        cmd.Cmd.__init__(self)

        self.db_con = sqlite3.connect(DEFAULT_DB)
        self.db_con.row_factory = sqlite3.Row

        self.cur_game_id = -1

        cur = self.db_con.cursor()
        
        for statement in sql_statements:
            cur.execute(statement)

        self.db_con.commit()

        # Load history on start.
        reload_history()

    #--------------------------------------------------------------------------
    # Overrides.
    #--------------------------------------------------------------------------

    def cmdloop(self, intro=None):
        """
        Override cmdloop to log starting up.

        Optional Args:
            intro <str>: Intro string to print.
        """
        LOG("President is starting up...")
        cmd.Cmd.onecmd(self, "help")
        cmd.Cmd.onecmd(self, "help verbose")
        cmd.Cmd.cmdloop(self, intro=intro)

    def precmd(self, line):
        """
        Reload history before running command, appending command to be run.

        Required Args:
            line <str>: Command to be executed.
        """
        if (line):
            os.system("echo \"{l}\" >> {f}".format(l=' '.join(pipes.quote(a) for a in shlex.split(line)), f=HISTORY_FILE))
        return cmd.Cmd.precmd(self, line)

    def postcmd(self, stop, line):
        """
        Reload history after running command.

        Required Args:
            stop <bool>: Stop execution after command.
            line <str>: Command executed.
        """
        reload_history()
        return cmd.Cmd.postcmd(self, stop, line)

    def emptyline(self):
        """
        Do nothing on empty line input.
        """
        pass

    def do_help(self, *args):
        """
        Show command list and instructions for verbose help message.
        """
        cmd.Cmd.do_help(self, *args)
        if (not args[0]):
            print("For verbose help output, use \"help verbose\".\n")

    def help_verbose(self, line=''):
        """
        Full help message with examples.
        """
        print(
            "---------------------------------------------------------------------------"                               +\
            "\n  This script can be used to keep track of the ledger in Gostop."                                        +\
            "\n---------------------------------------------------------------------------"                             +\
            "\n"
        )

    #--------------------------------------------------------------------------
    # Operational commands.
    #--------------------------------------------------------------------------

    def do_clear(self, line=''):
        """
        Clear screen, return to prompt.
        """
        os.system("clear")
        self.emptyline()

    def help_clear(self):
        """
        Display help for do_clear.
        """
        print("Clear screen, return to prompt.")

    def do_quit(self, line=''):
        """
        Shut down utility.
        """
        parser = argparse.ArgumentParser(prog="quit", description="Shut down utility.")
        try:
            args = parser.parse_args(shlex.split(line))
        except SystemExit:
            return
        return True

    def help_quit(self):
        """
        Display help for do_quit.
        """
        self.do_quit("-h")

    def do_exit(self, line=''):
        """
        Shut down utility.
        """
        parser = argparse.ArgumentParser(prog="exit", description="Shut down utility.")
        try:
            args = parser.parse_args(shlex.split(line))
        except SystemExit:
            return
        return True

    def help_exit(self):
        """
        Display help for do_exit.
        """
        self.do_exit("-h")

    #--------------------------------------------------------------------------
    # Helper commands.
    #--------------------------------------------------------------------------

    def _insert_new_win_points(self, player_game_id, win_type, num_points):
        """
        Insert a new row into win_points table
        """

        cmd = ''' INSERT INTO win_points(player_game_id, win_type, points)
                  VALUES(?,?,?) '''

        cur = self.db_con.cursor()
        cur.execute(cmd, (player_game_id, win_type, num_points))

        self.db_con.commit()

        return cur.lastrowid

    def _insert_new_players_game(self, game_id, player_id):
        """
        Insert a new row into players_games
        """

        cmd = ''' INSERT INTO players_game(game_id, player_id)
                  VALUES(?,?) '''

        cur = self.db_con.cursor()
        cur.execute(cmd, (game_id, player_id))

        self.db_con.commit()

        return cur.lastrowid

    def _insert_new_player(self, name):
        """
        Insert a new player into the players table
        """

        cmd = ''' INSERT INTO players(name, balance)
                  VALUES(?,?) '''

        cur = self.db_con.cursor()
        cur.execute(cmd, (name, 0))

        self.db_con.commit()

        return cur.lastrowid

    def _insert_new_game(self, dealer_id):
        """
        Insert new game into game database
        """

        cmd = ''' INSERT INTO games(dealer_id) VALUES(?) '''
        
        cur = self.db_con.cursor()
        cur.execute(cmd, (dealer_id, ))

        self.db_con.commit()

        return cur.lastrowid

    def _get_win_points(self, game_id):
        """
        Get the information about a specific game by id
        """

        get_cmd = ''' SELECT name, win_type, points
                      FROM win_points
                      JOIN players_game ON win_points.player_game_id = players_game.id
                      JOIN players ON players_game.player_id = players.id
                      WHERE game_id=? '''

        cur = self.db_con.cursor()
        res = cur.execute(get_cmd, (game_id, ))
        
        g_obj = res.fetchall()
        game_dict = [dict(g) for g in g_obj]
        if len(game_dict) == 0:
            return None

        return game_dict

    def _get_game_player(self, game_id, player_id):
        """
        Get the information about a specific game by id
        """

        get_cmd = ''' SELECT *
                      FROM players_game
                      WHERE game_id=? AND player_id=? '''

        cur = self.db_con.cursor()
        res = cur.execute(get_cmd, (game_id, player_id))
        
        g_obj = res.fetchall()
        game_player_dict = [dict(g) for g in g_obj]
        if len(game_player_dict) == 0:
            return None

        return game_player_dict

    def _get_game_players(self, game_id):
        """
        Get the information about a specific game by id
        """

        get_cmd = ''' SELECT name, player_id
                      FROM players_game
                      JOIN players ON players_game.player_id = players.id
                      WHERE game_id=? '''

        cur = self.db_con.cursor()
        res = cur.execute(get_cmd, (game_id, ))
        
        g_obj = res.fetchall()
        game_dict = [dict(g) for g in g_obj]
        if len(game_dict) == 0:
            return None

        return game_dict

    def _get_game(self, id):
        """
        Get the information about a specific game by id
        """

        get_cmd = ''' SELECT * FROM games WHERE id=? '''

        cur = self.db_con.cursor()
        res = cur.execute(get_cmd, (id, ))
        
        g_obj = res.fetchall()
        game_dict = [dict(g) for g in g_obj]
        if len(game_dict) == 0:
            return None

        return game_dict

    def _get_player(self, name=None, id=None):
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
        else:
            get_cmd = ''' SELECT * FROM players '''

            res = cur.execute(get_cmd)

        p_obj = res.fetchall()
        players = [dict(p) for p in p_obj]

        if len(players) == 0:
            return None

        return players

    def _calc_game_balance(self, game_id):
        """
        Do a lot of the heavy lifting in this function, 
        gonna calculate all the point deltas

        return a dictionary of player ids and point deltas
        """


    #--------------------------------------------------------------------------
    # User cli commands.
    #--------------------------------------------------------------------------
    
    def do_show_game(self, line=''):
        """
        Show the current game
        """
        parser = argparse.ArgumentParser(prog="show_game", description="Show the current game information")
        try:
            args = parser.parse_args(shlex.split(line))
        except SystemExit:
            return

        if self.cur_game_id == -1: 
            ERR("There is no currently active game")
            return

        game = self._get_game(self.cur_game_id)
        if game is None:
            ERR("Invalid state: saved game idx has been corrupted, please restart")
            return

        print("Game")
        print(game)

        players_game_data = self._get_game_players(self.cur_game_id)
        if players_game_data is None:
            ERR("Invalid state: players data is corrupted, please restart")
            return

        print("Players")
        for players_game in players_game_data:
            print(players_game)

        print("Points")
        point_totals = self._get_win_points(self.cur_game_id)
        if point_totals is not None:
            for point in point_totals:
                print(point)

    def do_end_game(self, line=''):
        """
        End the current game and add scors
        """
        parser = argparse.ArgumentParser(prog="end_game", description="Show the current game information")
        parser.add_argument("player", help="The name of the player who sold.")
        parser.add_argument("points", help="How much they sold for.")
        try:
            args = parser.parse_args(shlex.split(line))
        except SystemExit:
            return

        if self.cur_game_id == -1: 
            ERR("There is no currently active game")
            return
        
        game = self._get_game(self.cur_game_id)
        if game is None:
            ERR("Invalid state: saved game idx has been corrupted, please restart")
            return

        winner_player = self._get_player(name=args.player)
        if winner_player is None:
            ERR("Unknown player {}".format(args.player))
            return

        winner_player_game = self._get_game_player(self.cur_game_id, winner_player[0]["id"])
        if winner_player_game is None:
            ERR("Invalid state: saved game idx has been corrupted, please restart")
            return

        self._insert_new_win_points(winner_player_game[0]["id"], "POINTS", args.points)

    def do_add_first_round_lock(self, line=''):
        """
        add a sell bonus to the current game
        """
        parser = argparse.ArgumentParser(prog="add_first_round_lock", description="show the current game information")
        parser.add_argument("player", help="the name of the player who sold.")
        try:
            args = parser.parse_args(shlex.split(line))
        except SystemExit:
            return

        if self.cur_game_id == -1:
            ERR("There is no currently active game")
            return

        game = self._get_game(self.cur_game_id)
        if game is None:
            ERR("Invalid state: saved game idx has been corrupted, please restart")
            return

        frl_player = self._get_player(name=args.player)
        if frl_player is None:
            ERR("Unknown player {}".format(args.player))
            return

        frl_player_game = self._get_game_player(self.cur_game_id, frl_player[0]["id"])
        if frl_player_game is None:
            ERR("Invalid state: saved game idx has been corrupted, please restart")
            return

        self._insert_new_win_points(frl_player_game[0]["id"], "FIRST_ROUND_LOCK", 5)

    def do_add_sell_bonus(self, line=''):
        """
        add a sell bonus to the current game
        """
        parser = argparse.ArgumentParser(prog="add_sell_bonus", description="show the current game information")
        parser.add_argument("player", help="the name of the player who sold.")
        parser.add_argument("bonus", help="how much they sold for.")
        try:
            args = parser.parse_args(shlex.split(line))
        except SystemExit:
            return

        if self.cur_game_id == -1:
            ERR("There is no currently active game")
            return

        game = self._get_game(self.cur_game_id)
        if game is None:
            ERR("Invalid state: saved game idx has been corrupted, please restart")
            return

        bonus_winner = self._get_player(name=args.player)
        if bonus_winner is None:
            ERR("Unknown player {}".format(args.player))
            return

        if game[0]["dealer_id"] == bonus_winner[0]["id"]:
            ERR("Dealer cannot be the bonus winner")
            return

        bonus_winner_player_game = self._get_game_player(self.cur_game_id, bonus_winner[0]["id"])
        if bonus_winner_player_game is None:
            ERR("Invalid state: saved game idx has been corrupted, please restart")
            return

        self._insert_new_win_points(bonus_winner_player_game[0]["id"], "SELL", args.bonus)

    def do_start_game(self, line=''):
        """
        Start a game with a set of players
        """
        parser = argparse.ArgumentParser(prog="show_players", description="Show the list of deployers/double-checkers.")
        try:
            args = parser.parse_args(shlex.split(line))
        except SystemExit:
            return

        if self.cur_game_id != -1:
            ERR("Please conclude the previous game before starting a new one")
            return

        dealer_name = input("Enter the dealers name: ")
        dealer = self._get_player(name=dealer_name)
        if dealer is None:
            ERR("Could not find {} in known players, cannot start game".format(dealer_name))
            return

        # Create a new game and save off the game_id
        self.cur_game_id = self._insert_new_game(dealer[0]["id"])

        # Create a new players_game for the dealer
        self._insert_new_players_game(self.cur_game_id, dealer[0]["id"])

        try:
            num_players = 1
            while num_players < 4:
                player_name = input("Enter a player's name (CTRL+C when done): ")
                player = self._get_player(name=player_name)
                if player is None:
                    ERR("Could not find {} in known players, not adding".format(player_name))
                    continue

                self._insert_new_players_game(self.cur_game_id, player[0]["id"])
                num_players = num_players + 1
                
        except KeyboardInterrupt:
            pass

        LOG("\nPlayers have been selected")

    def do_show_players(self, line=''):
        """
        Show the list of players.

        Optional Args:
            file <str>: Path to users file.
        """
        parser = argparse.ArgumentParser(prog="show_players", description="Show the list of deployers/double-checkers.")
        try:
            args = parser.parse_args(shlex.split(line))
        except SystemExit:
            return

        players = self._get_player()
        if players is not None:
            for player in players:
                print(player)
        else:
            print("No players found")

    def do_add_player(self, line=''):
        """
        Add a new player to the list of players with an score of 0.

        Required Args:
            user <str>: The name of the player to add.
        """
        parser = argparse.ArgumentParser(prog="add_player", description="Add a new player")
        parser.add_argument("player", help="The name of the user to add.")
        try:
            args = parser.parse_args(shlex.split(line))
        except SystemExit:
            return

        player = self._get_player(name=args.player)
        if player is not None:
            ERR("Player {} already exists".format(args.player))
            return 
        
        self._insert_new_player(args.player)
        LOG("{} added".format(args.player))

def main(argv=None):
    cli = Cli()

    try:
        cli.cmdloop()
    except KeyboardInterrupt:
        LOG("Shut down initiated by CTRL+C.")

    return 0

if __name__ == "__main__":
    sys.exit(main())
