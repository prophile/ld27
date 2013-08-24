var Sound = (function() {
    var MUSIC_SOURCE = "https://dl.dropboxusercontent.com/s/yxlhaq0abhdpxc3/music.mp3?token_hash=AAEHavddSaEmHL6s2nm3kVNdeVzTmTWHZB2cC9sQkQ24mQ&dl=1";
    var music = new Howl({urls: [MUSIC_SOURCE], buffer: true});

    var musicRequested = new Bacon.Bus();
    var musicEnabled = new Bacon.Bus();

    Constants.get('music_enable', function(enabled) {
        musicEnabled.push(enabled);
    });

    var musicPlaying = musicRequested.toProperty(false).and(musicEnabled.toProperty(true));

    var musicStartStop = musicPlaying.changes().skipDuplicates();

    musicStartStop.filter(function(x) { return x; }).onValue(function() {
        music.play();
        console.log("Playing music.");
    });

    musicStartStop.filter(function(x) { return !x; }).onValue(function() {
        music.stop();
        console.log("Stopping music.");
    });

    var playMusic = function() {
        musicRequested.push(true);
    };

    var stopMusic = function() {
        musicRequested.push(false);
    };

    return {'playMusic': playMusic,
            'stopMusic': stopMusic};
}());
