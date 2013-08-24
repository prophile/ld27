var World = (function() {
    var objects = [];

    var add = function(obj) {
        objects.push(obj);
    };

    var del = function(obj) {
        obj("delete");
        objects = _.filter(objects, function(x) { return x !== obj; });
    };

    var all = function(callback) {
        _.each(objects, callback);
    };

    return {"add": add, "delete": del, "all": all};
}());

setInterval(function() {
    World.all(function(x) { x("update") });
}, 1000 * (1 / 30));

var Entity = function(name) {
    name = (name === undefined) ? "Object" : name;

    var MAX_RECURSION_DEPTH = 10;
    var components = [];
    var recursionTrap = 0;

    var target = function(message) {
        if (recursionTrap > MAX_RECURSION_DEPTH) {
            console.log("Recursion trapped.");
            throw "Recursive message.";
        }
        //console.log("Message for " + name + ":");
        //console.log(message);
        if (typeof message === "string") {
            message = {"id": message};
        }
        if (message.id === "addComponent") {
            recursionTrap++;
            message.component.call(target, {id: "attach"});
            recursionTrap--;
            components.push(message.component);
            return true;
        } else if (message.id === "getName") {
            return name;
        } else {
            var cLen = components.length;
            for (var i = 0; i < cLen; ++i) {
                recursionTrap++;
                var rv = components[i].call(target, message);
                recursionTrap--;
                if (rv !== undefined) {
                    return rv;
                }
            }
        }
    };

    target.addComponent = function(component) {
        target({"id": "addComponent", "component": component});
    };

    return target;
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
            stage.removeChild(sprite);
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

