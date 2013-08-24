var Sound = (function() {
    var playMusic = function() {
        var url = "https://dl.dropboxusercontent.com/s/yxlhaq0abhdpxc3/music.mp3?token_hash=AAEHavddSaEmHL6s2nm3kVNdeVzTmTWHZB2cC9sQkQ24mQ&dl=1";
        var sound = new Howl({
            urls: [url]
        }).play();
    }
    return {'playMusic': playMusic};
}());
