#!/usr/bin/env python3

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

from gostop_database import GostopDB

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
        self.cur_game_id = -1

        self.gostop_db = GostopDB()

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

        game = self.gostop_db._get_game(self.cur_game_id)
        if game is None:
            ERR("Invalid state: saved game idx has been corrupted, please restart")
            return

        print("Game")
        print(game)

        players_game_data = self.gostop_db._get_game_players(self.cur_game_id)
        if players_game_data is None:
            ERR("Invalid state: players data is corrupted, please restart")
            return

        print("Players")
        for players_game in players_game_data:
            print(players_game)

        print("Points")
        point_totals = self.gostop_db._get_win_points(self.cur_game_id)
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
        
        game = self.gostop_db._get_game(self.cur_game_id)
        if game is None:
            ERR("Invalid state: saved game idx has been corrupted, please restart")
            return

        winner_player = self.gostop_db._get_player(name=args.player)
        if winner_player is None:
            ERR("Unknown player {}".format(args.player))
            return

        winner_player_game = self.gostop_db._get_game_player(self.cur_game_id, winner_player[0]["id"])
        if winner_player_game is None:
            ERR("Invalid state: saved game idx has been corrupted, please restart")
            return

        self.gostop_db._insert_new_win_points(winner_player_game[0]["id"], "POINTS", args.points)

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

        game = self.gostop_db._get_game(self.cur_game_id)
        if game is None:
            ERR("Invalid state: saved game idx has been corrupted, please restart")
            return

        frl_player = self.gostop_db._get_player(name=args.player)
        if frl_player is None:
            ERR("Unknown player {}".format(args.player))
            return

        frl_player_game = self.gostop_db._get_game_player(self.cur_game_id, frl_player[0]["id"])
        if frl_player_game is None:
            ERR("Invalid state: saved game idx has been corrupted, please restart")
            return

        self.gostop_db._insert_new_win_points(frl_player_game[0]["id"], "FIRST_ROUND_LOCK", 5)

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

        game = self.gostop_db._get_game(self.cur_game_id)
        if game is None:
            ERR("Invalid state: saved game idx has been corrupted, please restart")
            return

        bonus_winner = self.gostop_db._get_player(name=args.player)
        if bonus_winner is None:
            ERR("Unknown player {}".format(args.player))
            return

        if game[0]["dealer_id"] == bonus_winner[0]["id"]:
            ERR("Dealer cannot be the bonus winner")
            return

        bonus_winner_player_game = self.gostop_db._get_game_player(self.cur_game_id, bonus_winner[0]["id"])
        if bonus_winner_player_game is None:
            ERR("Invalid state: saved game idx has been corrupted, please restart")
            return

        self.gostop_db._insert_new_win_points(bonus_winner_player_game[0]["id"], "SELL", args.bonus)

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
        dealer = self.gostop_db._get_player(name=dealer_name)
        if dealer is None:
            ERR("Could not find {} in known players, cannot start game".format(dealer_name))
            return

        # Create a new game and save off the game_id
        self.cur_game_id = self.gostop_db._insert_new_game(dealer[0]["id"])

        # Create a new players_game for the dealer
        self.gostop_db._insert_new_players_game(self.cur_game_id, dealer[0]["id"])

        try:
            num_players = 1
            while num_players < 4:
                player_name = input("Enter a player's name (CTRL+C when done): ")
                player = self.gostop_db._get_player(name=player_name)
                if player is None:
                    ERR("Could not find {} in known players, not adding".format(player_name))
                    continue

                self.gostop_db._insert_new_players_game(self.cur_game_id, player[0]["id"])
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

        players = self.gostop_db._get_player()
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
        parser.add_argument("username", help="The username of the user to add.")
        try:
            args = parser.parse_args(shlex.split(line))
        except SystemExit:
            return

        player = self.gostop_db._get_player(name=args.username)
        if player is not None:
            ERR("Player {} already exists".format(args.player))
            return 
        
        self.gostop_db._insert_new_player(args.player, args.username)
        LOG("{} ({}) added".format(args.player, args.username))

def main(argv=None):
    cli = Cli()

    try:
        cli.cmdloop()
    except KeyboardInterrupt:
        LOG("Shut down initiated by CTRL+C.")

    return 0

if __name__ == "__main__":
    sys.exit(main())
