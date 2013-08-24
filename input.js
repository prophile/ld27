var Input = (function() {
    var recogniser = function(identifier) {
        identifier = identifier.charAt(0).toUpperCase() + identifier.slice(1);
        if (identifier.length == 1) {
            var code = identifier.charCodeAt(0);
            return function(x) {
                return x.keyCode == code;
            };
        } else if (identifier == 'Escape') {
            return function(x) {
                return x.keyCode == 27;
            }
        } else if (identifier == 'Space') {
            return function(x) {
                return x.keyCode == 32;
            }
        } else {
            return function(x) {
                return x.keyIdentifier == identifier;
            }
        }
    };
    var presses = new Bacon.Bus();
    var releases = new Bacon.Bus();
    var mapping = [];
    Constants.getAll(function(x) {
        mapping = [];
        _.each(x, function(binding, key) {
            var match = /^key_(.*)/.exec(key);
            if (match) {
                var command = match[1];
                var key = recogniser(binding);
                mapping.push([key, command]);
            }
        });
    });
    var propogateEvent = function(evt, bus) {
        _.each(mapping, function(map) {
            if (map[0](evt)) {
                bus.push(map[1]);
            }
        });
    };
    $(document).keydown(function(evt) {
        propogateEvent(evt, presses);
    });
    $(document).keyup(function(evt) {
        propogateEvent(evt, releases);
    });
    var bindPress = function(command, callback) {
        presses.filter(function(x) { return x === command }).onValue(callback);
    };
    var bindHold = function(command, callback) {
        var down = presses.filter(function(x) { return x === command; });
        var up = releases.filter(function(x) { return x === command; });
        var barrier = down.map(true).merge(up.map(false)).toProperty(false);
        barrier = barrier.skipDuplicates();
        barrier.onValue(callback);
    };
    return {'press': bindPress,
            'hold': bindHold};
})();

