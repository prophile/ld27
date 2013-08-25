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
    Constants.get("game_size", function(value) {
        var game = new Game(value);
        game.setupCanvas();
        game.setupGame();

        Input.press("reloadConstants", Constants.reload);
    });
});

