var Physics = function() {
    PIXELS_PER_METER = 16;
    return function(context, gameWidth, gameHeight) {
        function newDebugDraw() {
            var debugDraw = new b2DebugDraw();
            debugDraw.SetSprite(document.getElementById("sup").getContext("2d"));
            debugDraw.SetDrawScale(PIXELS_PER_METER);
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

        var that = this;
        var turnRate = 0;
        var targetRotation = 0;
        var rotation = 0;
        var gravity = 0.00001;

        Constants.get("world_rotation_rate", function(value) {
            turnRate = value;
        });


        var debugDraw = newDebugDraw();

        this.world = new b2World(newGravity(), false);
        this.world.UserData = this;
        this.world.SetDebugDraw(debugDraw);
        Constants.get("world_gravity", function(value) {
            gravity = value;
            that.world.SetGravity(newGravity());
        });

        newWorld();

        this.newBlock = function(stage) {
            var fd                 = new b2FixtureDef;
            fd.shape               = new b2PolygonShape();
            fd.density = 1.0;
            fd.friction = 0.3;
            fd.restitution = 0.1;

            fd.shape.SetAsBox(1,1);

            var bodyDef                  = new b2BodyDef();
            bodyDef.type                 = b2Body.b2_dynamicBody;
            bodyDef.position.x           = 300/PIXELS_PER_METER;
            bodyDef.position.y           = 300/PIXELS_PER_METER;
            var body = that.world.CreateBody(bodyDef);
            body.CreateFixture(fd);

            var e = new Entity();
            Constants.get(["block_image", "block_scale"], function(value, scale) {
                var beeTexture = PIXI.Texture.fromImage(value, true);
                var beeSprite = new PIXI.Sprite(beeTexture);

                beeSprite.anchor.x = 0.5;
                beeSprite.anchor.y = 0.5;

                beeSprite.scale.x = scale;
                beeSprite.scale.y = scale;

                e.addComponent(SpriteComponent(stage, beeSprite));
                e.addComponent(PhysicsComponent(body));
                e.addComponent(MovableComponent());
                console.log("here");
                World.add(e);
            });
        };

        this.draw = function() {
            that.world.DrawDebugData();
        };

        this.update = function() {
            if (Math.abs(targetRotation - rotation) > turnRate) {
                function sign(x) { return x ? x < 0 ? -1 : 1 : 0; }
                direction = sign(targetRotation - rotation);
                rotation += direction * turnRate;
                that.world.SetGravity(newGravity());
            }

            that.world.Step(3,3);
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

        function addWall(x, y, width, height) {
            //floor
            var floorDef                 = new b2FixtureDef;
            floorDef.shape               = new b2PolygonShape();
            floorDef.shape.SetAsBox(width/2, height/2);
            floorDef.friction            = 0.2;
            floorDef.restitution         = 0.7;

            var floorBodyDef                  = new b2BodyDef();
            floorBodyDef.type                 = b2Body.b2_staticBody;
            floorBodyDef.position.x           = x/PIXELS_PER_METER;
            floorBodyDef.position.y           = y/PIXELS_PER_METER;
            that.world.CreateBody(floorBodyDef).CreateFixture(floorDef);
        }

        function newWorld() {
            addWall(gameWidth/2, 0, 10000, 3);
            addWall(gameWidth/2, gameHeight, 10000, 3);
            addWall(0, gameHeight/2, 3, 100000);
            addWall(gameWidth, gameHeight/2, 3, 100000);
        }

        this.rotate = rotate;
    };
}();
