var Game = function() {
    return function() {
        function unixTime() {
            return new Date().getTime() / 1000;
        }

        var that = this;
        var lastSpin = unixTime();

        var renderer = null;
        var physics = null;
        var context = null;
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
            physics = new Physics(context, canvasSize(), canvasSize());
        }


        this.step = function() {
            requestAnimFrame(that.step);
            that.update();
            that.render();
        }

        this.update = function() {
            spinIfNecessary();
            physics.update();
            $("#container").rotate(physics.getRotation());
        }

        function spinIfNecessary() {
            if (unixTime() - lastSpin > 1) {
                spin();
            }
        }

        function spin() {
            lastSpin = unixTime();
            physics.setTargetRotation(Math.random()*720);
            rotateCanvas(physics.getRotation());
        }

        this.render = function() {
            physics.draw();
            renderer.render(stage);
        }

        function rotateCanvas(rotation) {
            console.log(rotation);
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

            bee = Bee(stage);
            World.add(bee);
        }

    }
}();
