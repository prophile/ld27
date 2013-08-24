var Game = function() {
    return function() {
        var that = this;

        var renderer = null;
        var physics  = null;
        var stage    = null;
        var context  = null;

        this.setupCanvas = function() {
            renderer = PIXI.autoDetectRenderer(canvasSize(), canvasSize());
            $("#container").append("<canvas id='sup' width='" + canvasSize() + "' height='" + canvasSize() + "'></canvas>");

            context = document.getElementById("sup").getContext("2d");
            $("#sup").css({
                "z-index":100000,
                "position":"absolute"
            })
            $('#container').append(renderer.view);
            $("#container").css({
                "margin-top": ($(window).height()-canvasSize())/2
            });
        }

        this.setupGame = function() {
            pixiSetup();
            physics = new Physics(context);
        }


        this.step = function() {
            requestAnimFrame(that.step);
            that.update();
            that.render();
        }

        this.update = function() {
            var graphics = new PIXI.Graphics();

            // begin a green fill..
            graphics.beginFill(0x00FF00);

            // draw a triangle using lines
            graphics.moveTo(0,0);
            graphics.lineTo(0, 100);
            graphics.lineTo(100, 0);

            // end the fill
            graphics.endFill();

            // add it the stage so we see it on our screens..
            stage.addChild(graphics);
        }

        this.render = function() {
            renderer.render(stage);
            physics.world.DrawDebugData();
        }

        function canvasSize() {
            var $window = $(window);
            var width  = $window.width();
            var height = $window.height();

            var shortest = width < height ? width : height;
            return shortest/Math.sqrt(2);
        }

        function pixiSetup() {
            stage = new PIXI.Stage(0x66FF99);
            stage.position.x = canvasSize()/2;
            stage.position.y = canvasSize()/2;
            requestAnimFrame(that.step);
        }
    }
}();
