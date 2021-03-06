var Game = function() {
    return function(size) {

        var that      = this;
        var lastSpin  = unixTime() + Constants.k("first_spin_delay");
        var lastSpawn = unixTime();
        var TITLE_SCREEN = 0;
        var GAME = 1;
        var END_SCREEN = 2;
        var stateBus     = new Bacon.Bus;
        var currentState = stateBus.toProperty(TITLE_SCREEN);

        var renderer = null;
        var physics  = null;
        var context  = null;
        var periods  = 1;

        setInterval(function() {
            periods++;
            console.log("new period");
        }, Constants.k("spin_increase_period"));

        gameWidth = size;
        gameHeight = size;
        var stage    = null;
        var container = null;
        var titleStage = null;
        var titleContainer = null;

        var endStage = null;
        var endContainer = null;
        var score = 0;

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
                stateBus.push(END_SCREEN);
                Sound.playBell();
                var text = new PIXI.Text("Score: " + score, {font:"50px Arial", fill:"black"});
                text.position.y = 250;
                endContainer.addChild(text);
                that.rotation = 0;
                $("#container").resetRotate();
            }, function(timeRemaining) {
                if (timeRemaining <= 5) {
                    Sound.playWarning();
                    $("#time").css({"background-color":"#c00"});
                } else {
                    Sound.stopWarning();
                    $("#time").css({"background-color":"#0c0"});
                }

                $("#time").css({"width":(timeRemaining/10.0*canvasSize()) + "px"});
            });
            currentState.changes()
                        .filter(function(x) { return x == GAME; })
                        .onValue(function() {
                            setTimeout(function() {
                                physics.startClock();
                            }, Constants.k("first_spin_delay")*1000);
                spawnBlocks();
            });
            pixiSetup();
            soundSetup();
            var inputs = Input.key('title_to_game');
            inputs.filter(currentState.map(function(x) { return x === TITLE_SCREEN; }))
                  .onValue(function() { stateBus.push(GAME); });
            inputs.filter(currentState.map(function(x) { return x === END_SCREEN; }))
                  .onValue(function() { location.reload(); });
        };

        var stepTitle = function() {
            that.draw_title_screen();
        };

        var stepGame = function() {
            that.update();
            that.render();
        };

        var stepEnd = function() {
            that.draw_end_screen();
        };

        var stepFunction = currentState.map(function(s) {
            switch (s) {
                case TITLE_SCREEN: return stepTitle;
                case GAME: return stepGame;
                case END_SCREEN: return stepEnd;
            }
        });

        var stepBus = new Bacon.Bus();

        stepFunction.sampledBy(stepBus).onValue(function (callback) {
            callback();
        });

        this.step = function() {
            score += 7;
            requestAnimFrame(that.step);
            stepBus.push();
        };

        this.draw_title_screen = function() {
            titleContainer.scale.x = canvasSize()/gameWidth;
            titleContainer.scale.y = canvasSize()/gameWidth;
            renderer.render(titleStage);
        };

        this.draw_end_screen = function() {
            endContainer.scale.x = canvasSize()/gameWidth;
            endContainer.scale.y = canvasSize()/gameWidth;
            renderer.render(endStage);
            $("#sup").hide();
        };

        this.update = function() {
            value = Constants.k('target_cheeses');
            $("#removed").text("Score: " + score);
            spinIfNecessary();
            physics.update(function() {
                lastSpin = unixTime();
            });
            $("#container").rotate(physics.getRotation());
        };

        function spinIfNecessary() {
            value = Constants.k('spin_interval');
            console.log(lastSpin);
            if (unixTime() - lastSpin > value) {
                spin(periods);
            }
        }

        function spawnBlocks() {
            blockSpawnDelayMs = Constants.k('block_spawn_delay_ms');
            if (Constants.k('debug_noSpawnBlocks'))
                return;
            var timer = setInterval(function() {
                physics.newBlock("block", container);
            }, blockSpawnDelayMs);
        }

        var spinInterval = null;

        var direction = 1;
        var ticks = 0;
        function spin(periods) {
            lastSpin = unixTime();
            min = Constants.k('minimum_rotation');
            max = Constants.k('maximum_rotation');

            console.log(ticks);
            ticks++;
            if (ticks > Constants.k("spin_change_min_ticks") && Math.random() < Constants.k("spin_change_prob")) {
                console.log("change!!!!!!!!!!!");
                ticks = 0;
                direction = -direction;
            }

            if (Constants.k('debug_noSpin'))
                return;

            var range = max - min;
            var angle = direction * (periods * Constants.k("spin_increase")) * (min + Math.random() * range);
            physics.setTargetRotation(angle + physics.getRotation());
        }

        this.render = function() {
            physics.draw(canvasSize()/gameWidth);
            container.scale.x = canvasSize()/gameWidth;
            container.scale.y = canvasSize()/gameWidth;
            renderer.render(stage);
        };

        function rotateCanvas(rotation) {
        }

        function pixiSetup() {
            preload();
            lastSpin = unixTime() + Constants.k("first_spin_delay");
            lastSpawn = unixTime();
            stage = new PIXI.Stage(0x66FF99);
            container = new PIXI.DisplayObjectContainer();
            stage.position.x = gameWidth/2;
            stage.position.y = gameHeight/2;
            stage.addChild(container);

            var value = Constants.k('clock_face');
            var clock = new BaseEntity();
            var beeTexture = PIXI.Texture.fromImage(value, true);
            var beeSprite = new PIXI.Sprite(beeTexture);
            beeSprite.width = gameWidth;
            beeSprite.height = gameHeight;
            clock = new FixedLocationAdapter(0, 0, 0, clock)
            clock = new SpriteAdapter(container, beeSprite, clock);
            World.add(clock);

            physics.newGoal(gameWidth, container);
            var value = Constants.k('clock_hands');
            var clock = new BaseEntity();
            var beeTexture = PIXI.Texture.fromImage(value, true);
            var beeSprite = new PIXI.Sprite(beeTexture);
            beeSprite.width = gameWidth;
            beeSprite.height = gameHeight;
            clock = new FixedLocationAdapter(0, 0, 0, clock)
            clock = new SpriteAdapter(container, beeSprite, clock);
            World.add(clock);
            requestAnimFrame(that.step);

            titleStage = new PIXI.Stage(0xFFFF00);
            titleStage.position.x = gameWidth/2;
            titleStage.position.x = gameHeight/2;
            titleContainer = new PIXI.DisplayObjectContainer();
            var titleSpriteName = Constants.k("title_sprite");
            console.log(titleSpriteName);
            var spriteTexture  = PIXI.Texture.fromImage(titleSpriteName, true);
            var titleSprite    = new PIXI.Sprite(spriteTexture);
            titleSprite.width = gameWidth;
            titleSprite.height = gameHeight;
            titleContainer.addChild(titleSprite);
            titleStage.addChild(titleContainer);

            endStage = new PIXI.Stage(0xFFFF00);
            endStage.position.x = gameWidth/2;
            endStage.position.x = gameHeight/2;
            endContainer = new PIXI.DisplayObjectContainer();
            var endSpriteName = Constants.k("end_sprite");
            var spriteTexture  = PIXI.Texture.fromImage(endSpriteName, true);
            var endSprite    = new PIXI.Sprite(spriteTexture);
            endSprite.width = gameWidth;
            endSprite.height = gameHeight;
            endContainer.addChild(endSprite);
            endStage.addChild(endContainer);

            physics.newBlock("player", container);

            var platThickness = Constants.k('platform_thickness');
            var platLength = Constants.k('platform_length');
            var platDepth = Constants.k('platform_depth');
            var platInvDepth = 1 - platDepth;
            physics.newPlatform(platDepth*gameWidth,
                                platDepth*gameHeight,
                                platLength, platThickness,
                                (45 + 90)*0.5, container);
            physics.newPlatform(platInvDepth*gameWidth,
                                platInvDepth*gameHeight,
                                platLength, platThickness,
                                (45 + 90)*0.5, container);
            physics.newPlatform(platDepth*gameWidth,
                                platInvDepth*gameHeight,
                                platLength, platThickness,
                                (135 + 90)*0.5, container);
            physics.newPlatform(platInvDepth*gameWidth,
                                platDepth*gameHeight,
                                platLength, platThickness,
                                (135 + 90)*0.5, container);
            physics.newPlatform(0.5*gameWidth,
                                0.13*gameHeight,
                                3, 9,
                                0, container,
                                true);
            physics.newPlatform(0.5*gameWidth,
                                0.87*gameHeight,
                                3, 9,
                                0, container,
                                true);
            physics.newPlatform(0.87*gameWidth,
                                0.5*gameHeight,
                                9, 3,
                                0, container,
                                true);
            physics.newPlatform(0.13*gameWidth,
                                0.5*gameHeight,
                                9, 3,
                                0, container,
                                true);
        }

        function soundSetup() {
            Sound.playMusic();
        }

        var preload_asset = function(a) {
            PIXI.Texture.fromImage('http://badman.teaisaweso.me/?uri=http://game.teaisaweso.me/dropbox-assets/ArtAssets/' + a + '.png', true);
        };

        var preload = function() {
            // reload keys
            var KEYS = ['Mouse_Static',
                        'Mouse_Static_Right',
                        'blocksfinal/Block_anger_blue',
                        'blocksfinal/Block_anger',
                        'blocksfinal/Block_Blue_Cool',
                        'blocksfinal/Block_Cool',
                        'blocksfinal/Block_Excited_blue',
                        'blocksfinal/Block_Excited',
                        'blocksfinal/Block_Glee_blue',
                        'blocksfinal/Block_Glee',
                        'blocksfinal/Block_Seething_blue',
                        'blocksfinal/Block_Seething',
                        'blocksfinal/Block_Shock_blue',
                        'blocksfinal/Block_Shock',
                        'blocksfinal/Block_Worried_blue',
                        'blocksfinal/Block_Worried',
                        'Mouse_Walkleft_a',
                        'Mouse_Walkleft_b',
                        'Mouse_Walkleft_c',
                        'Mouse_Walkleft_d',
                        'Mouse_Walkright_a',
                        'Mouse_Walkright_b',
                        'Mouse_Walkright_c',
                        'Mouse_Walkright_d',
                        'minutehand',
                        'Minuteandhourhand',
                        'Hourhand',
                        'Exit',
                        'Background_Clock'];
            _.each(KEYS, function(key) {
                preload_asset(key);
            });
        };
    };
}();
