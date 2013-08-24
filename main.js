$(function() {
    var stage = new PIXI.Stage(0x66FF99);
    var renderer = PIXI.autoDetectRenderer(400, 400);

    var texture, object;

    var animate = function() {
        requestAnimFrame(animate);

        object.rotation += 0.1

        renderer.render(stage);
    };

    $('#container').append(renderer.view);

    requestAnimFrame(animate);

    texture = PIXI.Texture.fromImage('bee.png');
    object = new PIXI.Sprite(texture);

    object.anchor.x = 0.5;
    object.anchor.y = 0.5;

    object.position.x = 200;
    object.position.y = 150;

    stage.addChild(object);
});

