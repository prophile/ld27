var Sound = (function() {
    var MUSIC_SOURCE = "http://badman.teaisaweso.me/?uri=game.teaisaweso.me/dropbox-assets/Sound/music.mp3";

    var musicRequested = new Bacon.Bus();
    var musicEnabled = new Bacon.Bus();
    var musicLoaded = new Bacon.Bus();

    var warningRequested = new Bacon.Bus();
    var warningLoaded = new Bacon.Bus();

    Constants.wait(function() {
        enabled = Constants.k('music_enable');
    });

    var music = new Howl({urls: [MUSIC_SOURCE],
                          buffer: true,
                          onload: function() {
                              musicLoaded.push(true);
                              console.log("Finished loading music.");
                          }});

    var musicPlaying = (musicRequested.toProperty(false).
                                       and(musicEnabled.toProperty(true)).
                                       and(musicLoaded.toProperty(false)));

    var musicStartStop = musicPlaying.changes().skip(1).skipDuplicates();

    musicStartStop.filter(function(x) { return x; }).onValue(function() {
        music.play();
        console.log("Playing music.");
    });

    musicStartStop.filter(function(x) { return !x; }).onValue(function() {
        music.stop();
        console.log("Stopping music.");
    });

    var warningPlaying = warningRequested.toProperty(false)
                                         .and(warningLoaded.toProperty(false));
    var warningStartStop = warningPlaying.changes().skip(1).skipDuplicates();

    var warning = new Howl({
        urls: ['http://badman.teaisaweso.me/?uri=http://game.teaisaweso.me/dropbox-assets/Sound/clock_tick_002.mp3'],
        onload: function() {
            warningLoaded.push(true);
        }
    });

    warningStartStop.filter(function(x) { return x; }).onValue(function() {
        warning.play();
        console.log("Playing warning.");
    });

    warningStartStop.filter(function(x) { return !x; }).onValue(function() {
        warning.stop();
        console.log("Stopping warning.");
    });

    var collect = new Howl({urls: ['http://badman.teaisaweso.me/?uri=http://game.teaisaweso.me/dropbox-assets/Sound/collect.wav']});
    var bell = new Howl({urls: ['http://badman.teaisaweso.me/?uri=http://game.teaisaweso.me/dropbox-assets/Sound/bell.mp3']});
    var jump = new Howl({urls: ['http://badman.teaisaweso.me/?uri=http://game.teaisaweso.me/dropbox-assets/Sound/jump.wav']});

    var playSound = function(url) {
        console.log("palying");
        var sound = new Howl({
            urls: [url]
        }).play();
    }

    var playMusic = function() {
        musicRequested.push(true);
    };

    var stopMusic = function() {
        musicRequested.push(false);
    };

    var playWarning = function() {
        warningRequested.push(true);
    };

    var stopWarning = function() {
        warningRequested.push(false);
    };

    var doNothing = function() {};

    return {'playMusic': playMusic,
            'stopMusic': stopMusic,
            'playWarning': playWarning,
            'stopWarning': stopWarning,
            'playBell': function() { bell.play(); },
            'playJump': function() { jump.play(); },
            'playCollect': function() { collect.play(); }};
}());

