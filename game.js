var Game = function() {
    return function() {
        function unixTime() {
            return new Date().getTime() / 1000;
        }

        var that      = this;
        var lastSpin  = unixTime();
        var lastSpawn = unixTime();

        var renderer = null;
        var physics  = null;
        var context  = null;
        var stage    = null;

        function canvasSize() {
            var $window = $(window);
            return Math.min($window.width(), $window.height()) / Math.sqrt(2);
        }

        this.setupCanvas = function() {
            renderer = PIXI.autoDetectRenderer(canvasSize(), canvasSize());
            $("#container").append("<canvas id='sup' width='" + canvasSize() + "' height='" + canvasSize() + "'></canvas>");

            context = document.getElementById("sup").getContext("2d");
            $("#sup").css({
                "z-index":100000,
                "position":"absolute"
            });
            $('#container').append(renderer.view);
            $("#container").css({
                "margin-top": ($(window).height()-canvasSize())/2
            });
        };

        this.setupGame = function() {
            physics = new Physics(context, canvasSize(), canvasSize());
            pixiSetup();
            soundSetup();
        };


        this.step = function() {
            requestAnimFrame(that.step);
            that.update();
            that.render();
        };

        this.update = function() {
            spinIfNecessary();
            physics.update();
            $("#container").rotate(physics.getRotation());
        };

        function spinIfNecessary() {
            Constants.get("spin_interval", function(value) {
                if (unixTime() - lastSpin > value) {
                    spin();
                }
            });

            Constants.get("spawn_interval", function(value) {
                if (unixTime() - lastSpawn > value) {
                    spawnBlocks();
                }
            });
        }

        function spawnBlocks() {
            Constants.get(["blocks_to_spawn", "block_spawn_delay_ms"], function(blocksToSpawn, blockSpawnDelayMs) {
                lastSpawn = unixTime();
                var block_count = 0;
                var timer = setInterval(function() {
                    physics.newBlock(stage);
                    block_count++;
                    if (block_count == blocksToSpawn) {
                        clearInterval(timer);
                    }
                }, blockSpawnDelayMs);
            });
        }

        function spin() {
            lastSpin = unixTime();
            physics.setTargetRotation(Math.random()*720);
            rotateCanvas(physics.getRotation());
        }

        this.render = function() {
            physics.draw();
            renderer.render(stage);
        };

        function rotateCanvas(rotation) {
        }

        function pixiSetup() {
            stage = new PIXI.Stage(0x66FF99);
            stage.position.x = canvasSize()/2;
            stage.position.y = canvasSize()/2;
            requestAnimFrame(that.step);

            bee = Bee(stage);
            World.add(bee);
            physics.newBlock(stage);
        }

        function soundSetup() {
            Sound.playMusic();
        }
    };
}();
