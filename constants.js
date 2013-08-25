function unixTime() {
    return new Date().getTime() / 1000;
}
Constants = (function() {
    var CONSTANTS_URIS = [
        'http://constantine.teaisaweso.me/json',
        'local.json'
    ];

    var constantsLoaded = $.Deferred();
    var constantMap = {};

    var checkLoaded = function() {
        if (constantsLoaded.state() != 'resolved') {
            throw "Constants not loaded.";
        }
    };

    var getAll = function(callback) {
        checkLoaded();
        callback(constantMap);
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
            for (var i = 0; i < arguments.length; ++i) {
                var value = arguments[i];
                if (typeof value === "string") {
                    value = JSON.parse(value);
                }
                _.each(value['constants'], function(tuple) {
                    constantMap[tuple.name] = typeDecoders[tuple.type](tuple.value);
                });
            }
            constantsLoaded.resolve();
        });
    };

    var get = function(keys, callback) {
        getAll(function(all) {
            if (typeof keys === "string") {
                keys = [keys];
            }
            var values = _.map(keys, function(k) { return all[k]; });
            callback.apply(null, values);
        });
    };

    $(_.defer(reload));

    var wait = function(callback) {
        constantsLoaded.done(callback);
    };

    return {'getAll': getAll,
            'get': get,
            'wait': wait};

}());

