jQuery.fn.rotate = function(degrees) {
    $(this).css({'-webkit-transform' : 'rotate('+ degrees +'deg)',
        '-moz-transform' : 'rotate('+ degrees +'deg)',
    '-ms-transform' : 'rotate('+ degrees +'deg)',
    'transform' : 'rotate('+ degrees +'deg)'});
};

$(function() {
    Constants.get("game_size", function(value) {
        var game = new Game(value);
        game.setupCanvas();
        game.setupGame();

        Input.press("reloadConstants", Constants.reload);
    });
});

