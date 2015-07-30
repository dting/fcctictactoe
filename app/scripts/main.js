'use strict';

var app = angular.module('TicTacToeApp', ['ngMaterial']);

app.config(function($mdThemingProvider) {
  $mdThemingProvider.theme('default')
    .primaryPalette('grey')
    .accentPalette('red')
    .warnPalette('green');
});

app.controller('AppCtrl', [
  '$scope',
  '$timeout',
  'Game',
  'MinimaxService',
  function($scope, $timeout, Game, MinimaxService) {
    var vm = this;
    vm.game = new Game();
    vm.classForSymbol = function(symbol) {
      return symbol === 'x' ? 'md-accent' : 'md-warn';
    };
    vm.clickTile = function(idx) {
      if (vm.game.board.tiles[idx] || vm.thinking || vm.gameOver) {
        return;
      }
      vm.game.started = true;
      vm.thinking = true;
      vm.game.board.mark(vm.game.symbols.human, idx);
      vm.gameOver = vm.game.board.winner() || vm.game.board.full();
      if (!vm.gameOver) {
        vm.game.board.mark(vm.game.symbols.computer,
          MinimaxService.getMove(vm.game));
      }
      vm.gameOver = vm.game.board.winner() || vm.game.board.full();
      vm.thinking = false;
    };

    $scope.$watch('vm.gameOver', function(newVal, oldVal) {
      if (newVal !== oldVal && newVal) {
        $timeout(function() {
          vm.game = new Game();
          vm.gameOver = false;
        }, 2000);
      }
    });
  }
]);

app.service('MinimaxService', [
  function() {
    this.getMove = function(game) {
      var board = game.board;
      var best = -2;
      var bestMove;
      board.moves().forEach(function(move) {
        var score = miniMove(makeMove(board, game.symbols.computer, move),
          game.symbols);
        if (score > best) {
          best = score;
          bestMove = move;
        }
      });
      return bestMove;
    };

    function miniMove(board, symbols) {
      var winner = board.winner();
      var best = 2;
      if (winner === symbols.computer) return 1;
      if (winner === symbols.human) return -1;
      if (board.full()) return 0;
      board.moves().forEach(function(move) {
        var score = maxiMove(makeMove(board, symbols.human, move), symbols);
        if (score < best) best = score;
      });
      return best;
    }

    function maxiMove(board, symbols) {
      var winner = board.winner();
      var best = -2;
      if (winner === symbols.computer) return 1;
      if (winner === symbols.human) return -1;
      if (board.full()) return 0;
      board.moves().forEach(function(move) {
        var score = miniMove(makeMove(board, symbols.computer, move), symbols);
        if (score > best) best = score;
      });
      return best;
    }

    function makeMove(board, symbol, move) {
      var newBoard = board.copy();
      newBoard.mark(symbol, move);
      return newBoard;
    }
  }
]);

app.factory('Board', [
  function() {
    var WINS = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // h
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // v
      [0, 4, 8], [2, 4, 6] // d
    ];

    function Board(tiles) {
      this.tiles = tiles ? tiles : Array.apply(null, Array(9));
    }

    Board.prototype.copy = function() {
      return new Board(this.tiles.slice());
    };

    Board.prototype.mark = function(symbol, index) {
      this.tiles[index] = symbol;
    };

    Board.prototype.moves = function() {
      var m = [];
      this.tiles.forEach(function(tile, move) {
        if (!tile) m.push(move);
      });
      return m;
    };

    Board.prototype.winner = function() {
      var i = WINS.length;
      for (var i = 0; i < WINS.length; i++) {
        var w = WINS[i];
        if (this.tiles[w[0]] === this.tiles[w[1]] &&
            this.tiles[w[1]] === this.tiles[w[2]]) {
          return this.tiles[w[0]];
        }
      }
      return '';
    };

    Board.prototype.full = function() {
      var i = this.tiles.length;
      while (i--) {
        if (!this.tiles[i]) return false;
      }
      return true;
    };

    return Board;
  }
]);

app.factory('Game', [
  'Board', function(Board) {
    function Game() {
      this.board = new Board();
      this.symbols = {human: 'o', computer: 'x'};
    }

    Game.prototype.toggleSymbols = function() {
      this.symbols.human =
        [this.symbols.computer, this.symbols.computer = this.symbols.human][0];
    };

    return Game;
  }
]);

app.filter("symbol", [
  '$sce', function($sce) {
    return function(symbol) {
      if (!symbol) return symbol;
      return $sce.trustAsHtml(symbol === 'x' ? '&times;' : '&#9675;');
    };
  }
]);
