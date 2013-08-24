LIBRARIES=howler.min.js pixi.js underscore-min.js Bacon.min.js
SOURCES=constants.js entity.js main.js game.js
CC_FLAGS=--compilation_level WHITESPACE_ONLY

all: deps ld.js

ld.js: $(SOURCES)
	closure-compiler --create_source_map ld.map $(CC_FLAGS) $(^:%=--js %) --js_output_file ld.js
	echo '//# sourceMappingURL=ld.map' >> ld.js

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

