var Game = function() {
    return function() {
        function unixTime() {
            return new Date().getTime() / 1000;
        }

        var that      = this;
        var lastSpin  = unixTime();
        var lastSpawn = unixTime();
        var TITLE_SCREEN = 0;
        var GAME = 1;
        var END_SCREEN = 2;
        var state     = TITLE_SCREEN;

        var renderer = null;
        var physics  = null;
        var context  = null;
        var stage    = null;
        var titleStage = null;

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
            if (state == TITLE_SCREEN) {
                console.log("title");
                Input.press("title_to_game", function() {
                    console.log("pushed");
                    state = GAME;
                });
                that.draw_title_screen();
            } else if (state == GAME) {
                that.update();
                that.render();
            } else {
                Input.press("end_to_game", function() {
                    state = GAME;
                });
                that.draw_end_screen();
            }
        };

        this.draw_title_screen = function() {
            renderer.render(titleStage);
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
                    physics.newBlock("block", stage);
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

            titleStage = new PIXI.Stage(0xFFFF00);
            var text = new PIXI.Text("lol title screen", {font:"50px Arial", fill:"red"});
            titleStage.addChild(text);

            physics.newBlock("player", stage, true);
        }

        function soundSetup() {
            Sound.playMusic();
        }
    };
}();
