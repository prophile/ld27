var World = (function() {
    var objects = [];

    var add = function(obj) {
        objects.push(obj);
    };

    var del = function(obj) {
        obj("delete");
        objects = _.filter(objects, function(x) { return x !== obj; });
    };

    var all = function(message) {
        _.each(objects, function(x) { x(message); });
    };

    var select = function(message, callback) {
        var best = null, bestCost = Number.POSITIVE_INFINITY;
        var caller = function(obj) {
            return function(x) {
                var cost = callback(x);
                if (cost === false)
                    return;
                if (cost < bestCost) {
                    bestCost = cost;
                    best = obj;
                }
            };
        };
        _.each(objects, function(obj) {
            obj({id: message,
                 callback: caller(obj)});
        });
        return best;
    };

    return {"add": add, "del": del, "all": all, "select": select};
}());

setInterval(function() {
    World.all("update");
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
    var currentJoint = null;
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
        if (message.id == "addWeldJoint") {
            var to = message.to;
            var sourceBody = message.sourceBody;
            if (to === undefined && sourceBody === undefined) {
                throw "Bad addWeldJoint message.";
            }
            if (sourceBody === undefined) {
                to({id: "addWeldJoint",
                    sourceBody: body});
                console.log("adding weld joint");
            } else {
                var destBody = body;
                var srcCentre = sourceBody.GetWorldCenter();
                var destCentre = body.GetWorldCenter();
                var b2Vec2 = Box2D.Common.Math.b2Vec2;
                var anchor = new b2Vec2(0.5*(srcCentre.x + destCentre.x),
                                        0.5*(srcCentre.y + destCentre.y));
                var def = new Box2D.Dynamics.Joints.b2WeldJointDef;
                def.Initialize(sourceBody, destBody, anchor);
                currentJoint = sourceBody.GetWorld().CreateJoint(def);
            }
        }
        if (message.id === "removeWeldJoint" && currentJoint !== null) {
            body.GetWorld().DestroyJoint(currentJoint);
            currentJoint = null;
            console.log("weld joint removed");
        }
    };
};

var MovableComponent = function() {
    var movement = [0, 0];
    var speed = 0.0;
    var verticalSpeedU = 0.0;
    var verticalSpeedC = 0.0;
    var hasCargo = false;
    return function(message) {
        var that = this;
        if (message.id === "gotCargo") {
            hasCargo = true;
        }
        if (message.id === "releaseCargo") {
            hasCargo = false;
        }
        if (message.id === "jump") {
            var speed = hasCargo ? verticalSpeedC : verticalSpeedU;
            console.log("jump at ", speed);
            that({id: "applyImpulse",
                  x: 0,
                  y: -speed});
        }
        if (message.id === "attach") {
            var left = false, right = false;
            var recompute = function() {
                var x = 0;
                if (left)
                    x -= 1;
                if (right)
                    x += 1;
                if (x < 0) {
                    that({id: "face", direction: "left"});
                } else if (x > 0) {
                    that({id: "face", direction: "right"});
                }
                movement[0] = x * speed;
                movement[1] = 0;
            };
            Input.press('move_up', function(x) {
                that("jump");
            });
            Input.press('gravityGun', function() {
                that("grab");
            });
            Input.hold('move_left', function(x) { left = x; recompute(); });
            Input.hold('move_right', function(x) { right = x; recompute(); });
        }
        if (message.id === "setMovementSpeed") {
            speed = message.speed;
        }
        if (message.id === "setVerticalSpeed") {
            verticalSpeedU = message.unemcumbered;
            verticalSpeedC = message.cargo;
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

var GrabberComponent = function() {
    var attached = null;
    var lastPosition = [0, 0];
    return function(message) {
        if (message.id === "position") {
            lastPosition[0] = message.x;
            lastPosition[1] = message.y;
        }
        if (message.id === "grab") {
            if (attached !== null) {
                this("removeWeldJoint");
                attached("removeWeldJoint");
                attached({id: "ungrabbed", sender: this});
                attached = null;
                this("releaseCargo");
            } else {
                var target = World.select("canGrab", function(pos) {
                    return Math.abs(lastPosition[0]-pos[0]) +
                           Math.abs(lastPosition[1]-pos[1]);
                });
                if (target) {
                    this("gotCargo");
                    target({id: "grabbed",
                            sender: this});
                }
            }
        }
        if (message.id === "attachLift") {
            if (attached === null) {
                attached = message.attached;
                this({id: "addWeldJoint",
                      to: attached});
            }
        }
    };
};

var GrabbableComponent = function() {
    var lastPosition = [0, 0];
    return function(message) {
        if (message.id === "position") {
            lastPosition[0] = message.x;
            lastPosition[1] = message.y;
        }
        if (message.id === "grabbed") {
            message.sender({id: "attachLift",
                            attached: this});
        }
        if (message.id === "canGrab") {
            message.callback(lastPosition);
        }
    };
};

var DebounceComponent = function(messageID, intervalConstant) {
    var lastHeard = Number.NEGATIVE_INFINITY;
    var spacing = Constants.k(intervalConstant);
    return function(message) {
        if (message.id == messageID) {
            var currentTime = unixTime();
            var since = currentTime - lastHeard;
            if (since >= spacing) {
                lastHeard = currentTime;
                console.log("permitted");
                return message;
            } else {
                console.log("debounced");
                return false;
            }
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

var RotateWithWorldComponent = function() {
    return function(message) {
        if (message.id == "updatePhysics") {
            var body = message.body;
            var phys = body.GetWorld().UserData;
            var rot = phys.getRotation();
            body.SetAngle(rot * (-Math.PI / 180));
        }
    };
};

