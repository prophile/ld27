var Physics = function() {
    PIXELS_PER_METER = 16;
    return function(context, gameWidth, gameHeight, endGameCallback) {
        var that = this;
        function newDebugDraw() {
            var debugDraw = new b2DebugDraw();
            debugDraw.SetSprite(document.getElementById("sup").getContext("2d"));
            debugDraw.SetDrawScale(PIXELS_PER_METER*that.debugScale);
            debugDraw.SetFillAlpha(0.5);
            debugDraw.SetLineThickness(1.0);
            debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
            return debugDraw;
        }

        var b2Vec2 = Box2D.Common.Math.b2Vec2;
        var b2BodyDef = Box2D.Dynamics.b2BodyDef;
        var b2Body = Box2D.Dynamics.b2Body;
        var b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
        var b2Fixture = Box2D.Dynamics.b2Fixture;
        var b2World = Box2D.Dynamics.b2World;
        var b2MassData = Box2D.Collision.Shapes.b2MassData;
        var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
        var b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
        var b2DebugDraw = Box2D.Dynamics.b2DebugDraw;
        var b2Settings = Box2D.Common.b2Settings;
        this.toRemove = [];
        this.boxesRemoved = 0;


        b2Settings.b2_maxTranslation = 10000.0;
        b2Settings.b2_maxTranslationSquared = 10000.0*10000.0;
        b2Settings.b2MixRestitution = function(r1, r2) {
            if (r1 === undefined)
                r1 = 0;
            if (r2 === undefined)
                r2 = 0;
            return Math.min(r1, r2);
        };

        var turnRate = 0;
        var targetRotation = 0;
        var rotation = 0;
        var gravity = 0.00001;

        Constants.get("world_rotation_rate", function(value) {
            turnRate = value;
        });


        this.world = new b2World(newGravity(), false);
        this.world.UserData = this;

        var debugDraw = newDebugDraw();

        Constants.get("debug_physics", function(value) {
            if (value) {
                that.world.SetDebugDraw(debugDraw);
            } else {
                that.world.SetDebugDraw(null);
                debugDraw.m_sprite.graphics.clear();
            }
        });

        Constants.get("world_gravity", function(value) {
            gravity = value;
            that.world.SetGravity(newGravity());
        });

        var setPhysicalProperties = function(cls, fix, massless) {
            if (massless === undefined) {
                massless = false;
            }
            Constants.get([cls + '_friction',
                    cls + '_restitution'],
                    function(fric, rest) {
                        fix.SetFriction(fric);
                        fix.SetRestitution(rest);
                    });
            if (!massless) {
                Constants.get(cls + '_density',
                        function(density) {
                            fix.SetDensity(density);
                        });
            }
        };

        newWorld(endGameCallback);

        this.newBlock = function(cls, stage, controllable) {
            if (controllable === undefined) {
                controllable = false;
            }
            var fd                 = new b2FixtureDef;
            fd.shape               = new b2PolygonShape();
            fd.density = 1.0;
            fd.friction = 0.3;
            fd.restitution = 0.1;
            console.log("here");

            Constants.get("block_bad_prob", function(value) {
                var killsYou = Math.random() < value;
                console.log(killsYou);
                if (cls == "block" && killsYou) {
                    console.log("lol");
                    cls = "block_bad";
                }

                fd.shape.SetAsBox(1,1);

                var bodyDef                  = new b2BodyDef();
                bodyDef.type                 = b2Body.b2_dynamicBody;
                bodyDef.position.x           = 300/PIXELS_PER_METER;
                bodyDef.position.y           = 300/PIXELS_PER_METER;
                bodyDef.allowSleep           = false;
                if (controllable) {
                    bodyDef.fixedRotation = true;
                }
                var body = that.world.CreateBody(bodyDef);
                var fix = body.CreateFixture(fd);
                setPhysicalProperties(cls, fix);

                var e = new Entity();
                body.SetUserData({tag: "BLOCK", entity:e, "spawnTime":unixTime(), "killsYou":false});
                Constants.get([cls + "_image", cls + "_scale"], function(value, scale) {
                    var beeTexture = PIXI.Texture.fromImage(value, true);
                    var beeSprite = new PIXI.Sprite(beeTexture);

                    beeSprite.anchor.x = 0.5;
                    beeSprite.anchor.y = 0.5;

                    beeSprite.scale.x = scale;
                    beeSprite.scale.y = scale;

                    e.addComponent(SpriteComponent(stage, beeSprite));
                    e.addComponent(PhysicsComponent(body));
                    if (controllable) {
                        body.SetUserData({tag: "PLAYER", entity:e});
                        e.addComponent(MovableComponent());
                        Constants.get("movement_speed", function(x) {
                            e({id: "setMovementSpeed", speed: x});
                        });
                        Constants.get("movement_vertical", function(x) {
                            e({id: "setVerticalSpeed", speed: x});
                        });
                        e.addComponent(GrabberComponent());
                        e.addComponent(RotateWithWorldComponent());
                        e.addComponent(DebounceComponent('jump', 'jump_cooldown'));
                    } else if (killsYou) {
                        body.SetUserData({tag: "BLOCK", entity:e, "spawnTime":unixTime(), "killsYou":true});
                    } else {
                        e.addComponent(GrabbableComponent());
                    }
                    World.add(e);
                });
            });
        };

        this.draw = function(scaleFactor) {
            that.debugScale = scaleFactor;
            that.world.SetDebugDraw(newDebugDraw());
            that.world.DrawDebugData();
        };

        var velocityIterations = 12, positionIterations = 12;

        Constants.get(["physics_velocityIterations",
                "physics_positionIterations"],
                function(x, y) {
                    velocityIterations = x;
                    positionIterations = y;
                });

        this.update = function() {
            if (Math.abs(targetRotation - rotation) > turnRate) {
                function sign(x) { return x ? x < 0 ? -1 : 1 : 0; }
                direction = sign(targetRotation - rotation);
                rotation += direction * turnRate;
                that.world.SetGravity(newGravity());
            }

            that.toRemove = [];
            that.world.Step(1/60, velocityIterations, positionIterations);
            for (var i = 0; i < that.toRemove.length; i++) {
                var body = that.toRemove[i];
                that.world.DestroyBody(body);
                World.del(body.GetUserData().entity);
                that.boxesRemoved += 1;
            }
            that.world.ClearForces();
        };

        this.getRotation = function() {
            return rotation;
        };

        this.setTargetRotation = function(rotation) {
            targetRotation = rotation;
        };

        function newGravity() {
            var vector = rotate([0, gravity*PIXELS_PER_METER]);
            return new b2Vec2(vector[0], vector[1]);
        }

        function rotate(vec) {
            var sine   = Math.sin(rotation * (Math.PI/180));
            var cosine = Math.cos(rotation * (Math.PI/180));
            return [vec[0] * cosine + vec[1] * sine,
                   vec[0] * -sine + vec[1] * cosine];
        }

        function addWall(x, y, width, height, rotation, offset1, offset2) {
            //floor
            var floorDef                 = new b2FixtureDef;
            floorDef.shape               = new b2PolygonShape();
            floorDef.friction            = 0.2;
            floorDef.restitution         = 0.7;
            floorDef.shape.SetAsOrientedBox(width/2, height/2, new b2Vec2(offset1, offset2), rotation * Math.PI/180);

            var floorBodyDef                  = new b2BodyDef();
            floorBodyDef.type                 = b2Body.b2_staticBody;
            floorBodyDef.position.x           = x/PIXELS_PER_METER;
            floorBodyDef.position.y           = y/PIXELS_PER_METER;
            var body = that.world.CreateBody(floorBodyDef)
            body.SetUserData({'tag': 'WALL'});
                var fix = body.CreateFixture(floorDef);
            setPhysicalProperties('wall', fix, true);
        }

        function newWorld(endGameCallback) {
            addWall(gameWidth/2, 0, 10000, 3, 0, 0, 0);
            addWall(gameWidth/2, gameHeight, 10000, 3, 0, 0, 0);
            addWall(0, gameHeight/2, 3, 100000, 0, 0, 0);
            addWall(gameWidth, gameHeight/2, 3, 100000, 0, 0, 0);
            //addWall(gameWidth, gameHeight/2, 100000, 3, 45, 3, 3);
            addWall(gameWidth+gameWidth*0.25, gameHeight/2, 100000, 3, 45, 0, 0);
            addWall(-gameWidth*0.25, gameHeight/2, 100000, 3, 45, 0, 0);
            addWall(gameWidth/2, -gameHeight*0.25, 10000, 3, -45, 0, 0);
            addWall(gameWidth/2, gameHeight+gameHeight*0.25, 10000, 3, -45, 0, 0);
            var myContactListener = {
                "BeginContact" : function(contact) {
                    var data1 = contact.GetFixtureA().GetBody().GetUserData();
                    var data2 = contact.GetFixtureB().GetBody().GetUserData();
                    if (data1 && data2) {
                        if (data1.tag == "PLAYER" && data2.tag == "BLOCK") {
                            if (data2.killsYou) {
                                endGameCallback();
                            }
                        }
                        if (data2.tag == "PLAYER" && data1.tag == "BLOCK") {
                            if (data1.killsYou) {
                                endGameCallback();
                            }
                        }
                        if (data1.tag == "GOAL" && data2.tag == "BLOCK") {
                            if (unixTime() - data2.spawnTime > 5) {
                                that.toRemove.push(contact.GetFixtureB().GetBody());
                            }
                        }
                        if (data2.tag == "GOAL" && data1.tag == "BLOCK") {
                            if (unixTime() - data1.spawnTime > 5) {
                                that.toRemove.push(contact.GetFixtureA().GetBody());
                            }
                        }
                    }
                },
                "EndContact" : function() {
                },
                "PreSolve" : function() {
                },
                "PostSolve" : function() {
                }
            };
            that.world.SetContactListener(myContactListener);
        }

        this.newGoal = function(gameSize, stage) {
            Constants.get(["goal_width", "goal_height", "goal_image", "goal_scale"], function(width, height, image, scale) {
                //floor
                var floorDef                 = new b2FixtureDef;
                floorDef.shape               = new b2PolygonShape();
                floorDef.IsSensor            = true;
                //floorDef.friction            = 0.2;
                //floorDef.restitution         = 0.7;
                floorDef.shape.SetAsBox(width/2, height/2);

                var floorBodyDef                  = new b2BodyDef();
                floorBodyDef.type                 = b2Body.b2_staticBody;
                floorBodyDef.position.x           = gameSize*0.5/PIXELS_PER_METER;
                floorBodyDef.position.y           = gameSize*0.5/PIXELS_PER_METER;
                var body = that.world.CreateBody(floorBodyDef);

                body.SetUserData({tag: "GOAL"});
                var fix = body.CreateFixture(floorDef);
                fix.IsSensor = true;

                var e = new Entity();

                var beeTexture = PIXI.Texture.fromImage(image, true);
                var beeSprite = new PIXI.Sprite(beeTexture);

                beeSprite.anchor.x = 0.5;
                beeSprite.anchor.y = 0.5;
                beeSprite.position.x = gameSize*0.5;
                beeSprite.position.y = gameSize*0.5;

                beeSprite.scale.x = scale;
                beeSprite.scale.y = scale;
                e.addComponent(SpriteComponent(stage, beeSprite));
                World.add(e);
            });
        }

        this.rotate = rotate;
    };
}();
