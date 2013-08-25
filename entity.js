var World = (function() {
    var objects = [];

    var add = function(obj) {
        objects.push(obj);
    };

    var del = function(obj) {
        obj("delete");
        objects = _.filter(objects, function(x) { return x !== obj; });
    };

    var clear = function(obj) {
        objects = [];
    }

    var all = function(callback) {
        _.each(objects, callback);
    };

    return {"add": add, "del": del, "all": all};
}());

setInterval(function() {
    World.all(function(x) { x("update"); });
}, 1000 * (1 / 60));

var RecursionTrap = function(limit) {
    limit = (limit || 1);
    var level = 0;

    this.safely = function(f) {
        level++;
        try {
            return f();
        } finally {
            level--;
        }
    };

    this.check = function() {
        if (level >= limit) {
            throw "Recursion overflowed.";
        }
    };
};

var Entity = function(name) {
    name = (name === undefined) ? "Object" : name;

    var MAX_RECURSION_DEPTH = 100;
    var recursionTrap = new RecursionTrap(MAX_RECURSION_DEPTH);
    var components = [];

    var wrapMessage = function(message) {
        if (message === false || message === null) {
            message = {"id": undefined};
        } else if (typeof message === "string") {
            message = {"id": message};
        }
        return message;
    };

    var target = function(message) {
        recursionTrap.check();
        //console.log("Message for " + name + ":");
        //console.log(message);
        message = wrapMessage(message);
        if (message.id === "addComponent") {
            recursionTrap.safely(function() {
                message.component.call(target, {id: "attach"});
            });
            components.unshift(message.component);
            return wrapMessage(null);
        } else {
            var cLen = components.length;
            for (var i = 0; i < cLen; ++i) {
                var rv = recursionTrap.safely(function() {
                    return components[i].call(target, message);
                });
                if (rv !== undefined) {
                    message = wrapMessage(rv);
                }
            }
            return rv;
        }
    };

    target.addComponent = function(component) {
        target({"id": "addComponent", "component": component});
    };

    return target;
};

var PhysicsComponent = function(body) {
    return function(message) {
        if (message.id === "update") {
            var position = body.GetTransform().position;
            this({id:"updatePhysics",
                  body:body});
            this({id:"position",
                  x: position.x * PIXELS_PER_METER,
                  y: position.y * PIXELS_PER_METER});
            this({id:"absRotation",
                  value: body.GetAngle() * 180/Math.PI});
        }
        if (message.id === "applyImpulse") {
            var phys = body.GetWorld().UserData;
            var rotated = phys.rotate([message.x * 60, message.y * 60]);
            var b2Vec2 = Box2D.Common.Math.b2Vec2;
            body.ApplyForce(new b2Vec2(rotated[0] * 60,
                                       rotated[1] * 60),
                            body.GetWorldCenter());
        }
    };
};

var MovableComponent = function() {
    var movement = [0, 0];
    var speed = 0.0;
    var verticalSpeed = 0.0;
    return function(message) {
        if (message.id === "attach") {
            var left = false, right = false;
            var recompute = function() {
                var x = 0;
                if (left)
                    x -= 1;
                if (right)
                    x += 1;
                movement[0] = x * speed;
                movement[1] = 0;
            };
            var that = this;
            Input.press('move_up', function(x) {
                that({id: "applyImpulse",
                      x: 0,
                      y: -verticalSpeed});
            });
            Input.hold('move_left', function(x) { left = x; recompute(); });
            Input.hold('move_right', function(x) { right = x; recompute(); });
        }
        if (message.id === "setMovementSpeed") {
            speed = message.speed;
        }
        if (message.id === "setVerticalSpeed") {
            verticalSpeed = message.speed;
        }
        if (message.id === "updatePhysics") {
            phys = message.body.GetWorld().UserData;
            rotated = phys.rotate(movement);
            b2Vec2 = Box2D.Common.Math.b2Vec2;
            message.body.ApplyForce(new b2Vec2(rotated[0], rotated[1]),
                                    message.body.GetWorldCenter());
            //message.body.SetLinearVelocity(new b2Vec2(movement[0], movement[1]))
        }
    };
};

var SpriteComponent = function(stage, sprite) {
    stage.addChild(sprite);
    return function(message) {
        if (message.id === "position") {
            sprite.position = new PIXI.Point(message.x, message.y);
        }
        if (message.id === "rotate") {
            sprite.rotation += message.amount;
        }
        if (message.id === "delete") {
            console.log("got delete");
            stage.removeChild(sprite);
        }

        if (message.id === "absRotation") {
            sprite.rotation = message.value * Math.PI/180;
        }
    };
};

var RollComponent = function() {
    var rate = 0.0;
    return function(message) {
        if (message.id === "update") {
            this({id: "rotate", amount: rate});
        }
        if (message.id === "rotationRate") {
            rate = message.rotationRate;
        }
    };
};

// ENTITY DEFINITIONS

var Bee = function(stage) {
    var entity = Entity("bee");

    var beeTexture = PIXI.Texture.fromImage('bee.png');
    var beeSprite = new PIXI.Sprite(beeTexture);

    beeSprite.anchor.x = 0.5;
    beeSprite.anchor.y = 0.5;

    entity.addComponent(SpriteComponent(stage, beeSprite));
    entity.addComponent(RollComponent());

    Constants.get("debug_beeRotationRate", function(x) {
        entity({"id": "rotationRate", "rotationRate": x});
    });

    entity({id: "position", x: 200, y: 200});

    return entity;
};
