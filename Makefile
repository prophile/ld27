LIBRARIES=howler.min.js pixi.js underscore-min.js Bacon.min.js

all: Makefile
	rm -f $(LIBRARIES) libraries.js
	wget 'https://raw.github.com/goldfire/howler.js/master/howler.min.js'
	wget 'https://raw.github.com/GoodBoyDigital/pixi.js/master/bin/pixi.js'
	wget 'http://underscorejs.org/underscore-min.js'
	wget 'https://raw.github.com/baconjs/bacon.js/master/dist/Bacon.min.js'
	cat $(LIBRARIES) > libraries.js

clean:
	rm -f $(LIBRARIES)

