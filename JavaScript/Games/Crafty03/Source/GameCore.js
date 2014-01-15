/**
 * @author Charlie Calvert
 */

/* globals Crafty: true */
/* jshint browser: true */


//  Allow tracking of X, Y coordinates on a Grid
Crafty.c('Grid', {
	init: function() {'use strict';
		this.attr({
			w: Crafty.game.map_grid.tile.width,
			h: Crafty.game.map_grid.tile.height
		});
	},

	// Locate this entity at the given position on the grid
	at: function(x, y) {'use strict';
		if (x === undefined && y === undefined) {
			return { x: this.x / Crafty.game.map_grid.tile.width, y: this.y / Crafty.game.map_grid.tile.height };
		} else {
			this.attr({ x: x * Crafty.game.map_grid.tile.width, y: y * Crafty.game.map_grid.tile.height });
			return this;
		}
	}
});

// An "Actor" is drawn on a Canvas and located on a 2D Grid
Crafty.c('Actor', {
	init: function() {'use strict';
		this.requires('2D, Canvas, Grid');
	},
});

// A Tree is Solid so we can detect collisions, see Player
Crafty.c('Tree', {
	init: function() {'use strict';
		this.requires('Actor, Solid, spr_tree');
	},
});

// A Bush is solid so we can detect collisions, see Player
Crafty.c('Bush', {
	init: function() {'use strict';
		this.requires('Actor, Solid, spr_bush');
	},
});

// This is the player-controlled character
Crafty.c('PlayerCharacter', {
	init: function() {'use strict';
		this.requires('Actor, Fourway, Collision, mainCharacter, SpriteAnimation')
			.fourway(4)
			.stopOnSolids()
			.onHit('Village', this.visitVillage)
			// These next lines define our four animations
			//  each call to .animate specifies:
			//  - the name of the animation
			//  - the x and y coordinates within the sprite
			//     map at which the animation set begins
			//  - the number of animation frames *in addition to* the first one
			.animate('PlayerMovingUp',    0, 2, 2)
			.animate('PlayerMovingRight', 0, 0, 2)
			.animate('PlayerMovingDown',  0, 2, 2)
			.animate('PlayerMovingLeft',  0, 0, 2);

		// Watch for a change of direction and switch animations accordingly
		var animation_speed = 8;
		this.bind('NewDirection', function(data) {
			if (data.x > 0) {
				this.animate('PlayerMovingRight', animation_speed, -1);
			} else if (data.x < 0) {
				this.animate('PlayerMovingLeft', animation_speed, -1);
			} else if (data.y > 0) {
				this.animate('PlayerMovingDown', animation_speed, -1);
			} else if (data.y < 0) {
				this.animate('PlayerMovingUp', animation_speed, -1);
			} else {
				this.stopMovement();
			}
		});
	},

	// Registers a stop-movement function to be called when
	//  this entity hits an entity with the "Solid" component
	stopOnSolids: function() {'use strict';
		this.onHit('Solid', this.stopMovement);
		return this;
	},

	// Stops the movement
	stopMovement: function() {'use strict';
		this._speed = 0;
		if (this._movement) {
			this.x -= this._movement.x;
			this.y -= this._movement.y;
		}
	},

	// Respond to this player visiting a village
	visitVillage: function(data) {'use strict';
		Crafty.game.reportEvent("Found Tower: " + data[0].obj._entityName);
		var villlage = data[0].obj;
		villlage.visit();
	}
});

// A village is a tile on the grid that the PC must visit in order to win the game
Crafty.c('Village', {
	init: function() {'use strict';
		this.requires('Actor, spr_village');
	},

	// Process a visitation with this village
	visit: function() {'use strict';
		this.destroy();
		Crafty.audio.play('knock');
		Crafty.trigger('VillageVisited', this);
	}
});

// Draw the initial game state
Crafty.scene('Game', function() {'use strict';
	
	// A 2D array to keep track of all gameBoard tiles
	this.gameBoard = new Array(Crafty.game.map_grid.width);
	for (var i = 0; i < Crafty.game.map_grid.width; i++) {
		this.gameBoard[i] = new Array(Crafty.game.map_grid.height);
		for (var j = 0; j < Crafty.game.map_grid.height; j++) {
			this.gameBoard[i][j] = false;
		}
	}

	// Player character, placed at 5, 5 on our grid
	this.player = Crafty.e('PlayerCharacter').at(5, 5);
	this.gameBoard[this.player.at().x][this.player.at().y] = true;

	// Place a tree at every edge square on our grid of 16x16 tiles
	for (var x = 0; x < Crafty.game.map_grid.width; x++) {
		for (var y = 0; y < Crafty.game.map_grid.height; y++) {
			var at_edge = x === 0 || x === Crafty.game.map_grid.width - 1 || y === 0 || y === Crafty.game.map_grid.height - 1;

			if (at_edge) {
				// Place a tree entity at the current tile
				Crafty.e('Tree').at(x, y);
				this.gameBoard[x][y] = true;
			} else if (Math.random() < 0.06 && !this.gameBoard[x][y]) {
				// Place a bush entity at the current tile
				Crafty.e('Bush').at(x, y);
				this.gameBoard[x][y] = true;
			}
		}
	}

	// Generate up to five villages on the map in random locations
	var max_villages = 5;
	for (x = 0; x < Crafty.game.map_grid.width; x++) {
		for (var y1 = 0; y1 < Crafty.game.map_grid.height; y1++) {
			if (Math.random() < 0.02) {
				if (Crafty('Village').length < max_villages && !this.gameBoard[x][y1]) {
					var village = Crafty.e('Village').at(x, y1);
					village.setName(village._entityName.replace('Entity', 'Village'));
				}
			}
		}
	}

	// Show the victory screen once all villages are visisted
	this.show_victory = this.bind('VillageVisited', function() {
		Crafty.game.sendDebugMessage("Village Length: " + Crafty('Village').length);
		if (!Crafty('Village').length) {
			Crafty.scene('Victory');
		}
	});
}, function() { 'use strict';
	// Remove our event binding from above so that we don't
	//  end up having multiple redundant event watchers after
	//  multiple restarts of the game
	this.unbind('VillageVisited', this.show_victory);
});


// Victory scene : Announce victory, set up a new game
Crafty.scene('Victory', function() {'use strict';
	// Display some text in celebration of the victory
	Crafty.e('2D, DOM, Text')
		.attr({ x: 0, y: 0 })
		.text('You are victorious!');

	// restart the game when a key is pressed
	this.restart = function() {
		Crafty.scene('Game');
	};
	
	// Bind keydown event. This was done wrong in the demo 
	this.bind('KeyDown', this.restart); 
}, function() { 'use strict';
	// Remove key binding to prevent multiple restarts 
	if (!this.unbind('KeyDown', this.restart)) {
		window.alert("Could not unbind");
	}
	
});

// Load binary assets such as images and audio files
Crafty.scene('Loading', function(){'use strict';
	
	var assets = ['Assets/cscGarden01-32X32.png',         
		'Assets/BoyWalk.png', 
		'Assets/door_knock_3x.mp3', 
		];
	
	// Load our sprite map image
	Crafty.load(assets, function(){
		Crafty.sprite(32, assets[0], {
			spr_tree:    [0, 3],
			spr_bush:    [2, 0],
			spr_village: [0, 1]
		});

		//  The main character
		Crafty.sprite(32, assets[1], {
			mainCharacter:  [0, 0],
		}, 0, 2);

		// Define our sounds for later use
		//Crafty.audio.add({
		//	knock: ['http://desolate-caverns-4829.herokuapp.com/assets/door_knock_3x.mp3']
		//});

		// Display text while loading		
		Crafty.e('2D, DOM, Text')
			.attr({ x: 0, y: Crafty.viewport.height / 2 - 24, w: Crafty.viewport.width })
			.text('Loading...');

		// Now that our sprites are ready to draw, start the game
		Crafty.scene('Game');
	});
});

