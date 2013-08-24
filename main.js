$(function() {

    function canvasSize() {
        var $window = $(window);
        var width  = $window.width();
        var height = $window.height();

        var shortest = width < height ? width : height;
        return shortest/Math.sqrt(2);
    }

    var stage = new PIXI.Stage(0x66FF99);
    var renderer = PIXI.autoDetectRenderer(canvasSize(), canvasSize());

    var texture, object;

    var beeRotationRate = 0.0;

    var animate = function() {
        requestAnimFrame(animate);

        object.rotation += beeRotationRate;

        renderer.render(stage);
    };

    $('#container').append(renderer.view);
    $("#container").css({
        "margin-top": ($(window).height()-canvasSize())/2
    });

    requestAnimFrame(animate);

    texture = PIXI.Texture.fromImage('bee.png');
    object = new PIXI.Sprite(texture);

    object.anchor.x = 0.5;
    object.anchor.y = 0.5;

    object.position.x = canvasSize()/2;
    object.position.y = canvasSize()/2;

    stage.addChild(object);

    Constants.get('debug_beeRotationRate', function(x) {
        beeRotationRate = x;
    });
});

