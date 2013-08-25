Constants = (function() {
    var CONSTANTS_URIS = [
        'http://constantine.teaisaweso.me/json',
        'local.json'
    ];

    var gotConstants = new Bacon.Bus();
    var constants = gotConstants.toProperty().skipDuplicates(_.isEqual);

    var getAll = function(callback) {
        constants.onValue(callback);
    };

    var reload = function() {
        var rawConstantFiles = $.when.apply($, _.map(CONSTANTS_URIS,
            function(uri) {
                var df = new $.Deferred();
                var raw = $.get(uri);
                raw.done(function(x) {
                    df.resolve(x);
                });
                raw.fail(function() {
                    df.resolve('{"constants":[]}');
                });
                return df;
        }));
        var typeDecoders = {'string': function(x) { return x; },
                            'float': parseFloat,
                            'integer': parseFloat,
                            'boolean': function(x) { return x; }};
        rawConstantFiles.done(function() {
            var actualConstants = {};
            for (var i = 0; i < arguments.length; ++i) {
                var value = arguments[i];
                if (typeof value === "string") {
                    value = JSON.parse(value);
                }
                _.each(value['constants'], function(tuple) {
                    actualConstants[tuple.name] = typeDecoders[tuple.type](tuple.value);
                });
            }
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

