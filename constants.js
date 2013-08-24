Constants = (function() {
    var CONSTANTS_URI = 'http://constantine.teaisaweso.me/json'

    var gotConstants = new Bacon.Bus();
    var constants = gotConstants.toProperty();

    var getAll = function(callback) {
        constants.onValue(callback);
    };

    var reload = function() {
        var rawConstants = $.get(CONSTANTS_URI);
        rawConstants.done(function(value) {
            var baseValues = JSON.parse(value);
            var actualConstants = {};
            _.each(baseValues['constants'], function(tuple) {
                actualConstants[tuple.name] = tuple.value;
            });
            gotConstants.push(actualConstants);
        });
    };

    var get = function(key, callback) {
        var newStream = constants.map(function(x) { return x[key]; }).skipDuplicates();
        newStream.onValue(callback);
    };

    constants.onValue(function() {
        console.log("Constants loaded.");
    });

    $(_.defer(reload));

    return {'getAll': getAll,
            'get': get,
            'reload': reload};

}());

