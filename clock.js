Clock = (function() {
    return function(max) {
        var timer = null;
        var level = max;

        var pulse = new Bacon.Bus;

        var stop = function() {
            if (timer !== null) {
                clearInterval(timer);
                timer = null;
            }
        };

        var start = function() {
            stop();
            timer = setInterval(function() {
                if (level < 0)
                    return;
                pulse.push(level);
                level -= 1;
            }, 1000);
        };

        var reset = function() {
            level = max;
        };

        var add = function(n) {
            level = Math.min(level + n, max);
        };

        var onPulse = function(callback) {
            pulse.onValue(callback);
        };

        var onOver = function(callback) {
            pulse.filter(function(x) { return x == 0; })
                 .onValue(callback);
        };

        return {
            reset: reset,
            add: add,
            start: start,
            stop: stop,
            onPulse: onPulse,
            onOver: onOver
        };
    };
}());

