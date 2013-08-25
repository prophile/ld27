jQuery.fn.rotate = function(degrees) {
    $(this).css({'-webkit-transform' : 'rotate('+ degrees +'deg)',
        '-moz-transform' : 'rotate('+ degrees +'deg)',
    '-ms-transform' : 'rotate('+ degrees +'deg)',
    'transform' : 'rotate('+ degrees +'deg)'});
};
jQuery.fn.resetRotate = function(degrees) {
    $(this).css({'-webkit-transform' : 'rotate(0deg)',
        '-moz-transform' : 'rotate(0deg)',
    '-ms-transform' : 'rotate(0deg)',
    'transform' : 'rotate(0deg)'});
};


$(function() {
    Constants.wait(function() {
        value = Constants.k('game_size');
        var game = new Game(value);
        game.setupCanvas();
        game.setupGame();
    });
});

