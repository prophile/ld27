var Game = function() {
    return function() {
        var that = this;

        var renderer = null;
        var stag = null;
        var bee = null;
        beeRotationRate = null;
        Constants.get('debug_beeRotationRate', function(x) {
            beeRotationRate = x;
        });

        function canvasSize() {
            var $window = $(window);
            var width  = $window.width();
            var height = $window.height();

            var shortest = width < height ? width : height;
            return shortest/Math.sqrt(2);
        }

        this.setupCanvas = function() {
            renderer = PIXI.autoDetectRenderer(canvasSize(), canvasSize());
            $('#container').append(renderer.view);
            $("#container").css({
                "margin-top": ($(window).height()-canvasSize())/2
            });
        }

        this.step = function() {
            requestAnimFrame(that.step);
            that.update();
            that.render();
        }

        this.setupGame = function() {
            stage = new PIXI.Stage(0x66FF99);
            requestAnimFrame(that.step);
            texture = PIXI.Texture.fromImage('bee.png');
            bee = new PIXI.Sprite(texture);

            bee.anchor.x = 0.5;
            bee.anchor.y = 0.5;

            bee.position.x = canvasSize()/2;
            bee.position.y = canvasSize()/2;
            stage.addChild(bee);
        }



        this.update = function() {
            bee.rotation += beeRotationRate;
        }

        this.render = function() {
            renderer.render(stage);
        }
    }
}();
