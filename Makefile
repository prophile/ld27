LIBRARIES=howler.min.js pixi.js underscore-min.js Bacon.min.js
SOURCES=constants.js sound.js clock.js input.js main.js physics.js game.js
CC_FLAGS=--compilation_level WHITESPACE_ONLY

all: deps ld.js

ld.js: $(SOURCES) entity.js
	uglifyjs $(SOURCES) --source-map ld.map --screw-ie8 --output $@ entity.js

howler.min.js:
	wget 'https://raw.github.com/goldfire/howler.js/master/howler.min.js'

pixi.js:
	wget 'https://raw.github.com/GoodBoyDigital/pixi.js/master/bin/pixi.js'

underscore-min.js:
	wget 'http://underscorejs.org/underscore-min.js'

Bacon.min.js:
	wget 'https://raw.github.com/baconjs/bacon.js/master/dist/Bacon.min.js'

entity.js: entity.coffee
	coffee --map --compile $^

deps: Makefile box2d.js $(LIBRARIES)
	cat $(LIBRARIES) > libraries.js

clean:
	rm -f $(LIBRARIES) libraries.js ld.js entity.js ld.map entity.map

.PHONY: all clean deps

