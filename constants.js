Constants = (function() {
    var CONSTANTS_URI = 'http://constantine.teaisaweso.me/json';

    var gotConstants = new Bacon.Bus();
    var constants = gotConstants.toProperty().skipDuplicates(_.isEqual);

    var getAll = function(callback) {
        constants.onValue(callback);
    };

    var reload = function() {
        var rawConstants = $.get(CONSTANTS_URI);
        var typeDecoders = {'string': function(x) { return x; },
                            'float': parseFloat,
                            'int': parseFloat,
                            'boolean': function(x) { return x; }};
        rawConstants.done(function(value) {
            var baseValues = JSON.parse(value);
            var actualConstants = {};
            _.each(baseValues['constants'], function(tuple) {
                actualConstants[tuple.name] = typeDecoders[tuple.type](tuple.value);
            });
            gotConstants.push(actualConstants);
        });
    };

    var get = function(keys, callback) {
        if (typeof keys === "string") {
            keys = [keys];
        }
        var newStream = constants.map(function(x) {
            return _.map(keys, function(y) { return x[y]; });
        }).skipDuplicates(_.isEqual);
        newStream.onValues(callback);
    };

    constants.onValue(function() {
        console.log("Constants loaded.");
    });

    $(_.defer(reload));

    // reload periodically, for dev
    setInterval(reload, 2500);

    return {'getAll': getAll,
            'get': get,
            'reload': reload};

}());

