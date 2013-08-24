jQuery.fn.rotate = function(degrees) {
    $(this).css({'-webkit-transform' : 'rotate('+ degrees +'deg)',
        '-moz-transform' : 'rotate('+ degrees +'deg)',
    '-ms-transform' : 'rotate('+ degrees +'deg)',
    'transform' : 'rotate('+ degrees +'deg)'});
};

$(function() {
    var game = new Game();
    game.setupCanvas();
    game.setupGame();
});

