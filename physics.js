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

        var turnRate = Constants.k('world_rotation_rate');
        var targetRotation = 0;
        var rotation = 0;
        var gravity = 0.00001;


        this.world = new b2World(newGravity(), false);
        this.world.UserData = this;

        gravity = Constants.k('world_gravity');
        that.world.SetGravity(newGravity());

        var setPhysicalProperties = function(cls, fix, massless) {
            if (massless === undefined) {
                massless = false;
            }
            fix.SetFriction(Constants.k(cls + '_friction'));
            fix.SetRestitution(Constants.k(cls + '_restitution'));
            if (!massless) {
                fix.SetDensity(Constants.k(cls + '_density'));
            }
        };

        newWorld(endGameCallback);

        this.newBlock = function(cls, stage) {
            var fd                 = new b2FixtureDef;
            fd.shape               = new b2PolygonShape();
            fd.density = 1.0;
            fd.friction = 0.3;
            fd.restitution = 0.1;

            badBlockChance = Constants.k('block_bad_prob');
            var killsYou = Math.random() < badBlockChance;
            if (cls == "block" && killsYou) {
                cls = "block_bad";
            }

            value = Constants.k(cls + '_image');
            scale = Constants.k(cls + '_scale');
            flags = Constants.k(cls + '_flags');
            size = Constants.k('game_size');
            dist = Constants.k('mousehole_spawn_distance');
            randomness = Constants.k('spawn_randomness');
            var bodyDef                  = new b2BodyDef();
            bodyDef.type                 = b2Body.b2_dynamicBody;
            if (/c/.exec(flags)) {
                fd.shape.SetAsBox(1, 2.5);
            } else {
                fd.shape.SetAsBox(1, 1);
            }
            var radius = dist;
            var gravVec = newGravity()
            gravVec.NegativeSelf();
            gravVec.Normalize();
            gravVec.Multiply(radius);

            var x = size/2+gravVec.x+Math.random()*randomness-randomness/2;
            var y = size/2+gravVec.y+Math.random()*randomness-randomness/2;

            bodyDef.position.x           = x/PIXELS_PER_METER;
            bodyDef.position.y           = y/PIXELS_PER_METER;
            bodyDef.allowSleep           = false;
            if (/f/.exec(flags)) {
                bodyDef.fixedRotation = true;
            }
            var body = that.world.CreateBody(bodyDef);
            var fix = body.CreateFixture(fd);
            setPhysicalProperties(cls, fix);

            var e = new BaseEntity();

            // pick a source
            value = value.split(' ');
            value = value[Math.floor(Math.random() * value.length)];
            var beeTexture = PIXI.Texture.fromImage(value, true);
            var beeSprite = new PIXI.Sprite(beeTexture);

            if (/c/.exec(flags)) {
                beeSprite.anchor.x = 0.42;
            } else {
                beeSprite.anchor.x = 0.5;
            }
            beeSprite.anchor.y = 0.5;

            beeSprite.scale.x = scale;
            beeSprite.scale.y = scale;

            e = new PhysicsEntityAdapter(body, e)
            e = new SpriteAdapter(stage, beeSprite, e);
            if (/f/.exec(flags)) {
                e = new RotateWithWorldAdapter(e);
            }
            if (/d/.exec(flags)) {
                e = new PoisonAdapter(endGameCallback, 'player', e);
            }
            if (/g/.exec(flags)) {
                e = new TagAdapter(['worthPoints', 'grabbable'], e);
                e = new ScoreAdapter(function(x) {
                    x.seppuku();
                }, e);
            }
            if (/t/.exec(flags)) {
                e = new TagAdapter(['block'], e);
                e = new LimitedLifespanAdapter(10, function() {
                    var total = 0;
                    World.all(function(x) {
                        if (e.hasTag('block')) {
                            total += 1;
                        }
                    });
                    return total > 20;
                }, e);
            }
            if (/c/.exec(flags)) {
                e = new TagAdapter(['player'], e);
                e = new LateralMovementAdapter(e);
                e = new GrabAdapter(e);
                e = new JumpAdapter(e);
                e = new DebugLateralMovementAdapter(e);
                e = new JumpSpacingAdapter(e);
                e = new ControlAdapter(e);
            }
            body.SetUserData({tag: "ENTITY", entity:e});
            World.add(e);
        };

        this.draw = function(scaleFactor) {
            if (Constants.k('debug_physics')) {
                that.debugScale = scaleFactor;
                that.world.SetDebugDraw(newDebugDraw());
                that.world.DrawDebugData();
            }
        };

        var doneRotating = true
        this.update = function(callback) {
            if (Math.abs(targetRotation - rotation) > turnRate) {
                doneRotating = false;
                function sign(x) { return x ? x < 0 ? -1 : 1 : 0; }
                direction = sign(targetRotation - rotation);
                rotation += direction * turnRate;
                that.world.SetGravity(newGravity());
            } else {
                if (!doneRotating) {
                    rotation = targetRotation;
                    callback();
                    doneRotating = true;
                }
            }

            that.toRemove = [];
            that.world.Step(1/60, Constants.k('physics_velocityIterations'), Constants.k('physics_positionIterations'));
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

        this.newPlatform = function(x, y, width, height, orientation, stage) {
            var orientationRadians  = orientation * (Math.PI/180);
            var platformDef         = new b2FixtureDef;
            platformDef.shape       = new b2PolygonShape();
            platformDef.friction    = 0.2;
            platformDef.restitution = 0.7;
            platformDef.shape.SetAsBox(width/2, height/2);

            var platformBodyDef    = new b2BodyDef();
            platformBodyDef.type   = b2Body.b2_staticBody;
            platformBodyDef.position.x = x/PIXELS_PER_METER;
            platformBodyDef.position.y = y/PIXELS_PER_METER;
            var body = that.world.CreateBody(platformBodyDef);
            body.SetAngle(orientationRadians*2);

            body.SetUserData({'tag': 'WALL'});

            var fix = body.CreateFixture(platformDef);
            setPhysicalProperties('platform', fix, true);
            var sprite = Constants.k("platform_sprite");
            var e = new BaseEntity();

            var beeTexture = PIXI.Texture.fromImage(sprite, true);
            var beeSprite = new PIXI.Sprite(beeTexture);

            beeSprite.anchor.x = 0.5;
            beeSprite.anchor.y = 0.5;

            beeSprite.width    = width*PIXELS_PER_METER;
            beeSprite.height   = height*PIXELS_PER_METER;

            e = new PhysicsEntityAdapter(body, e);
            e = new SpriteAdapter(stage, beeSprite, e);
            World.add(e);
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
                        if (data1.entity !== undefined && data2.entity !== undefined) {
                            data1.entity.collideInto(data2.entity);
                            data2.entity.collideInto(data1.entity);
                        }
                        if (data1.tag == "WALL" && data2.entity != null) {
                            data2.entity.doHitWall();
                        }
                        if (data2.tag == "WALL" && data1.entity != null) {
                            data1.entity.doHitWall();
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
            width = Constants.k('goal_width');
            height = Constants.k('goal_height');
            image = Constants.k('goal_image');
            scale = Constants.k('goal_scale');
            //floor
            var floorDef                 = new b2FixtureDef;
            floorDef.shape               = new b2PolygonShape();
            floorDef.isSensor            = true;
            //floorDef.friction            = 0.2;
            //floorDef.restitution         = 0.7;
            floorDef.shape.SetAsBox(width/2, height/2);

            var floorBodyDef                  = new b2BodyDef();
            floorBodyDef.type                 = b2Body.b2_staticBody;
            floorBodyDef.position.x           = gameSize*0.5/PIXELS_PER_METER;
            floorBodyDef.position.y           = gameSize*0.5/PIXELS_PER_METER;
            var body = that.world.CreateBody(floorBodyDef);

            var fix = body.CreateFixture(floorDef);

            var e = new BaseEntity();

            var beeTexture = PIXI.Texture.fromImage(image, true);
            var beeSprite = new PIXI.Sprite(beeTexture);

            beeSprite.anchor.x = 0.5;
            beeSprite.anchor.y = 0.5;

            beeSprite.scale.x = scale;
            beeSprite.scale.y = scale;
            e = new PhysicsEntityAdapter(body, e);
            e = new SpriteAdapter(stage, beeSprite, e);
            e = new PoisonAdapter(function(x) {
                x.doHitGoal();
            }, 'worthPoints', e);
            body.SetUserData({tag: "ENTITY", entity: e});
            World.add(e);
        }

        this.rotate = rotate;
    };
}();
