LIBRARIES=howler.js pixi.js underscore-min.js

all:
	wget 'https://github.com/goldfire/howler.js'
	wget 'https://github.com/GoodBoyDigital/pixi.js'
	wget 'http://underscorejs.org/underscore-min.js'
	cat $(LIBRARIES) > libraries.js

clean:
	rm -f $(LIBRARIES)

