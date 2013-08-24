var Game = function() {
    return function() {
        var that = this;

        var renderer = null;
        var stage = null;

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
            that.render();
        }

        this.setupGame = function() {
            stage = new PIXI.Stage(0x66FF99);
            requestAnimFrame(that.step);
            bee = Bee(stage);
            World.add(bee);
        }

        this.render = function() {
            renderer.render(stage);
        }
    }
}();
