var Game = function() {
    return function(size) {

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

        gameWidth = size;
        gameHeight = size;
        var stage    = null;
        var container = null;
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
                "top": ($(window).height()-canvasSize())/2,
                "left": ($(window).width()-canvasSize())/2
            });
        };

        this.setupGame = function() {
            physics = new Physics(context, gameWidth, gameHeight, function() {
                state = END_SCREEN;
                that.rotation = 0;
                setTimeout(function() {
                    $("#container").resetRotate();
                }, 300);
                console.log("reset");
            });
            pixiSetup();
            soundSetup();
            Input.press("title_to_game", function() {
                if (state === TITLE_SCREEN) {
                    console.log("pushed");
                    state = GAME;
                } else if (state === END_SCREEN) {
                    location.reload();
                }
            });
        };


        this.step = function() {
            requestAnimFrame(that.step);
            if (state == TITLE_SCREEN) {
                that.draw_title_screen();
            } else if (state == GAME) {
                that.update();
                that.render();
            } else {
                that.draw_end_screen();
            }
        };

        this.draw_title_screen = function() {
            renderer.render(titleStage);
        };

        this.draw_end_screen = function() {
            renderer.render(titleStage);
        };

        this.update = function() {
            value = Constants.k('target_cheeses');
            $("#removed").text("Boxes removed: " + physics.boxesRemoved + "/" + value);
            if (physics.boxesRemoved >= value) {
                state = END_SCREEN;
            }
            spinIfNecessary();
            physics.update(function() {
                lastSpin = unixTime();
                spawnBlocks();
            });
            $("#container").rotate(physics.getRotation());
        };

        function spinIfNecessary() {
            value = Constants.k('spin_interval');
            if (unixTime() - lastSpin > value) {
                spin();
            }
        }

        function spawnBlocks() {
            blocksToSpawn = Constants.k('blocks_to_spawn');
            blockSpawnDelayMs = Constants.k('block_spawn_delay_ms');
            if (Constants.k('debug_noSpawnBlocks'))
                return;
            lastSpawn = unixTime();
            var block_count = 0;
            var timer = setInterval(function() {
                physics.newBlock("block", container);
                block_count++;
                if (block_count == blocksToSpawn) {
                    clearInterval(timer);
                }
            }, blockSpawnDelayMs);
        }

        function spin() {
            lastSpin = unixTime();
            min = Constants.k('minimum_rotation');
            max = Constants.k('maximum_rotation');
            if (Constants.k('debug_noSpin'))
                return;
            var direction = Math.ceil(Math.random());
            if (direction == 0) {
                direction = -1;
            }

            var range = max - min;
            var angle = min + Math.random() * range;
            console.log(angle);
            console.log(range);
            physics.setTargetRotation(angle + physics.getRotation());
        }

        this.render = function() {
            physics.draw(canvasSize()/gameWidth);
            container.scale.x = canvasSize()/gameWidth;
            container.scale.y = canvasSize()/gameWidth;
            //console.log(stage.scale);
            renderer.render(stage);
        };

        function rotateCanvas(rotation) {
        }

        function pixiSetup() {
            lastSpin = unixTime();
            lastSpawn = unixTime();
            stage = new PIXI.Stage(0x66FF99);
            container = new PIXI.DisplayObjectContainer();
            stage.position.x = gameWidth/2;
            stage.position.y = gameHeight/2;
            stage.addChild(container);
            value = Constants.k('clock_face');
            var clock = new BaseEntity();
            console.log(value);
            var beeTexture = PIXI.Texture.fromImage(value, true);
            var beeSprite = new PIXI.Sprite(beeTexture);
            beeSprite.width = gameWidth;
            beeSprite.height = gameHeight;
            clock = new FixedLocationAdapter(0, 0, 0, clock)
            clock = new SpriteAdapter(container, beeSprite, clock);
            World.add(clock);
            physics.newGoal(gameWidth, container);
            requestAnimFrame(that.step);

            titleStage = new PIXI.Stage(0xFFFF00);
            var text = new PIXI.Text("lol title screen", {font:"50px Arial", fill:"red"});
            titleStage.addChild(text);

            physics.newBlock("player", container);
        }

        function soundSetup() {
            Sound.playMusic();
        }
    };
}();
