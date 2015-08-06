'use strict';

var app = angular.module('TicTacToeApp', ['ngMaterial']);

app.config(function($mdThemingProvider) {
  $mdThemingProvider.theme('default')
    .primaryPalette('grey')
    .accentPalette('red')
    .warnPalette('green');
});

app.controller('AppCtrl', ['$scope', '$timeout', 'Board', 'MinimaxService',
  function($scope, $timeout, Board, MinimaxService) {
    var vm = this;

    // Board
    vm.board = new Board();
    vm.clickTile = function(idx) {
      if (vm.board.tiles[idx] || vm.thinking || vm.gameOver) {
        return;
      }
      vm.thinking = true;
      vm.board.mark(1, idx);
      vm.gameOver = vm.board.winner() || vm.board.full();
      if (!vm.gameOver) {
        vm.board.mark(2, MinimaxService.getMove(vm.board));
      }
      vm.gameOver = vm.board.winner() || vm.board.full();
      vm.thinking = false;
    };

    // Symbols
    vm.symbols = {1: '&#9675;', 2: '&times;', 0: ''};
    vm.toggleSymbols = function() {
      if (_.any(this.board.tiles)) return;
      if (vm.symbols[2] === '&times;') {
        vm.symbols[2] = '&#9675;';
        vm.symbols[1] = '&times;';
      } else {
        vm.symbols[2] = '&times;';
        vm.symbols[1] = '&#9675;';
      }
    };
    vm.classForSymbol = function(symbol) {
      return symbol === '&times;' ? 'md-accent' : 'md-warn';
    };
    vm.symbolForPlayer = function(player) {
      return vm.symbols[player];
    };

    $scope.$watch('vm.gameOver', function(newVal, oldVal) {
      if (newVal !== oldVal && newVal) {
        $timeout(function() {
          vm.board = new Board();
          vm.gameOver = false;
        }, 2000);
      }
    });
  }
]);

app.service('MinimaxService', [function() {
  this.getMove = function(board) {
    var best = -1;
    var moves = board.moves();
    var bestMove = moves[0];
    if (moves.length < 8) {
      moves.forEach(function(move) {
        var score = miniMove(board.copy().mark(2, move), 0);
        if (score > best) {
          best = score;
          bestMove = move;
        }
      });
    } else if (_.contains(moves, 4)) {
      bestMove = 4;
    }
    return bestMove;
  };

  function miniMove(board, depth) {
    var winner = board.winner();
    var best = 0;
    if (winner === 2) return 20 - depth;
    if (winner === 1) return -1;
    board.moves().forEach(function(move) {
      best = Math.min(maxiMove(board.copy().mark(1, move), depth + 1), best);
    });
    return best;
  }

  function maxiMove(board, depth) {
    var winner = board.winner();
    var best = 0;
    if (winner === 2) return 1;
    if (winner === 1) return -20 + depth;
    board.moves().forEach(function(move) {
      best = Math.max(miniMove(board.copy().mark(2, move), depth + 1), best);
    });
    return best;
  }
}]);

app.constant('WINS', [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // h
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // v
  [0, 4, 8], [2, 4, 6] // d
]);

app.factory('Board', ['WINS', function(WINS) {
  function Board(tiles) {
    this.tiles = tiles ? tiles : [0, 0, 0, 0, 0, 0, 0, 0, 0];
  }

  Board.prototype.copy = function() {
    return new Board(this.tiles.slice());
  };

  Board.prototype.mark = function(player, index) {
    this.tiles[index] = player;
    return this;
  };

  Board.prototype.moves = function() {
    var m = [];
    this.tiles.forEach(function(tile, move) {
      if (!tile) m.push(move);
    });
    return m;
  };

  Board.prototype.winner = function() {
    for (var i = 0; i < WINS.length; i++) {
      var w = WINS[i];
      if (this.tiles[w[0]] &&
          this.tiles[w[0]] === this.tiles[w[1]] &&
          this.tiles[w[1]] === this.tiles[w[2]]) {
        return this.tiles[w[0]];
      }
    }
    return '';
  };

  Board.prototype.full = function() {
    return _.every(this.tiles, _.identity);
  };

  return Board;
}]);

app.filter("symbol", ['$sce', function($sce) {
  return function(symbol) {
    if (!symbol) return '';
    return $sce.trustAsHtml(symbol);
  };
}]);
