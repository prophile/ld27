LIBRARIES=howler.min.js pixi.js underscore-min.js Bacon.min.js
SOURCES=constants.js entity.js main.js physics.js game.js

all: deps ld.js

ld.js: $(SOURCES)
	echo "//# sourceMappingURL=ld.map" > $@
	closure-compiler $^ --create_source_map ld.map >> $@

howler.min.js:
	wget 'https://raw.github.com/goldfire/howler.js/master/howler.min.js'

pixi.js:
	wget 'https://raw.github.com/GoodBoyDigital/pixi.js/master/bin/pixi.js'

underscore-min.js:
	wget 'http://underscorejs.org/underscore-min.js'

Bacon.min.js:
	wget 'https://raw.github.com/baconjs/bacon.js/master/dist/Bacon.min.js'

deps: Makefile box2d.js $(LIBRARIES)
	cat $(LIBRARIES) > libraries.js

clean:
	rm -f $(LIBRARIES) libraries.js

