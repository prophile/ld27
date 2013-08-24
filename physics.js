var Physics = function() {
    PIXELS_PER_METER = 16;
    return function(constants, context, gameWidth, gameHeight) {
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
        var gameWidth = gameWidth;
        var gameHeight = gameHeight;
        var turnRate = 0;
        var targetRotation = 0;
        var rotation = 0;

        constants.get("world_rotation_rate", function(value) {
            turnRate = value;
        });


        var debugDraw = new b2DebugDraw();
        debugDraw.SetSprite(document.getElementById("sup").getContext("2d"));
        debugDraw.SetDrawScale(PIXELS_PER_METER);
        debugDraw.SetFillAlpha(0.5);
        debugDraw.SetLineThickness(1.0);
        debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);


        this.world = new b2World(newGravity());
        var debugDraw = newDebugDraw();
        this.world.SetDebugDraw(debugDraw);

        newWorld();

        this.draw = function() {
            that.world.DrawDebugData();
        };

        this.update = function() {
            if (Math.abs(targetRotation - rotation) > turnRate) {
                direction = Math.sign(targetRotation - rotation);
                rotation += turnRate;
                world.gravity = newGravity();
            }
        };

        this.getRotation = function() {
            return rotation;
        }

        this.setTargetRotation = function() {
        }

        function newGravity() {
            new b2Vec2(0, -PIXELS_PER_METER);
        }

        function addWall(x, y, width, height) {
            //floor
            var floorDef                 = new b2FixtureDef;
            floorDef.density             = 1.0;
            floorDef.friction            = 0.5;
            floorDef.restitution         = 0.2;
            floorDef.filter.categoryBits = 0x0002;
            floorDef.filter.maskBits     = 0x0001;
            floorDef.shape               = new b2PolygonShape();
            floorDef.shape.SetAsBox(width/2, height/2);

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
    }
}();
