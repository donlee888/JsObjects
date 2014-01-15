/* jshint browser: true */

angular.module('modGame', []).factory('game', function() { 'use strict';
    
    return {
        // This defines our grid's size and the size of each of its tiles
        map_grid : null,

        // The total width of the game screen. Since our grid takes up the entire screen
        //  this is just the width of a tile times the width of the grid
        width : function() {
            return this.map_grid.width * this.map_grid.tile.width;
        },

        // The total height of the game screen. Since our grid takes up the entire screen
        //  this is just the height of a tile times the height of the grid
        height : function() {
            return this.map_grid.height * this.map_grid.tile.height;
        },

        // Initialize and start our game
        start : function(mapGrid) {
            // Start crafty and set a background color so that we can see it's working
            var gameDiv = document.getElementById("gameBoard");
            this.map_grid = mapGrid;
            //this.map_grid.tile.width = dimensions.tileWidth;
            //this.map_grid.tile.height = dimensions.tileHeight;
            Crafty.init(Crafty.game.width(), Crafty.game.height(), gameDiv);
            Crafty.background('rgb(0, 109, 20)');

            // Simply start the "Loading" scene to get things going
            Crafty.scene('Loading');
        }
    };
});

// The Grid component allows an element to be located
//  on a grid of tiles
Crafty.c('Grid', { 
    init : function() { 'use strict';
        this.attr({
            w : Crafty.game.map_grid.tile.width,
            h : Crafty.game.map_grid.tile.height
        });
    },

    // Locate this entity at the given position on the grid
    at : function(x, y) { 'use strict';
        if (x === undefined && y === undefined) {
            return {
                x : this.x / Crafty.game.map_grid.tile.width,
                y : this.y / Crafty.game.map_grid.tile.height
            };
        } else {
            this.attr({
                x : x * Crafty.game.map_grid.tile.width,
                y : y * Crafty.game.map_grid.tile.height
            });
            return this;
        }
    }
});

// An "Actor" is an entity that is drawn in 2D on canvas
//  via our logical coordinate grid
Crafty.c('Actor', {
    init : function() { 'use strict';
        this.requires('2D, Canvas, Grid');
    },
});

// A Tree is just an Actor with a certain color
Crafty.c('Tree', {
    init : function() { 'use strict';
        this.requires('Actor, Solid, spr_tree');
    },
});

// A Bush is just an Actor with a certain color
Crafty.c('Bush', {
    init : function() { 'use strict';
        this.requires('Actor, Solid, spr_bush');
    },
});

// This is the player-controlled character
Crafty.c('PlayerCharacter', {
    init : function() { 'use strict';
        this.requires('Actor, Fourway, Collision, spr_player, SpriteAnimation').fourway(4).stopOnSolids().onHit('Village', this.visitVillage)
        // These next lines define our four animations
        //  each call to .animate specifies:
        //  - the name of the animation
        //  - the x and y coordinates within the sprite
        //     map at which the animation set begins
        //  - the number of animation frames *in addition to* the first one
        .animate('PlayerMovingUp', 0, 2, 2).animate('PlayerMovingRight', 0, 0, 2).animate('PlayerMovingDown', 0, 2, 2).animate('PlayerMovingLeft', 0, 0, 2);

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
    stopOnSolids : function() { 'use strict';
        this.onHit('Solid', this.stopMovement);

        return this;
    },

    // Stops the movement
    stopMovement : function() { 'use strict';
        this._speed = 0;
        if (this._movement) {
            this.x -= this._movement.x;
            this.y -= this._movement.y;
        }
    },

    // Respond to this player visiting a village
    visitVillage : function(data) { 'use strict';
        var villlage = data[0].obj;
        villlage.visit();
    }
});

// A village is a tile on the grid that the PC must visit in order to win the game
Crafty.c('Village', {
    init : function() { 'use strict';
        this.requires('Actor, spr_village');
    },

    // Process a visitation with this village
    visit : function() { 'use strict';
        this.destroy();
        Crafty.audio.play('knock');
        Crafty.trigger('VillageVisited', this);
    }
});

// Game scene
// -------------
// Runs the core gameplay loop
Crafty.scene('Game', function() { 'use strict';
    // A 2D array to keep track of all occupied tiles
    this.occupied = new Array(Crafty.game.map_grid.width);
    for (var i = 0; i < Crafty.game.map_grid.width; i++) {
        this.occupied[i] = new Array(Crafty.game.map_grid.height);
        for (var j = 0; j < Crafty.game.map_grid.height; j++) {
            this.occupied[i][j] = false;
        }
    }

    // Player character, placed at 5, 5 on our grid
    this.player = Crafty.e('PlayerCharacter').at(5, 5);
    this.occupied[this.player.at().x][this.player.at().y] = true;

    // Place a tree at every edge square on our grid of 16x16 tiles
    for (var x = 0; x < Crafty.game.map_grid.width; x++) {
        for (var y = 0; y < Crafty.game.map_grid.height; y++) {
            var at_edge = x === 0 || x === Crafty.game.map_grid.width - 1 || y === 0 || y === Crafty.game.map_grid.height - 1;

            if (at_edge) {
                // Place a tree entity at the current tile
                Crafty.e('Tree').at(x, y);
                this.occupied[x][y] = true;
            } else if (Math.random() < 0.06 && !this.occupied[x][y]) {
                // Place a bush entity at the current tile
                Crafty.e('Bush').at(x, y);
                this.occupied[x][y] = true;
            }
        }
    }

    // Generate up to five villages on the map in random locations
    var max_villages = 5;
    for (var col = 0; col < Crafty.game.map_grid.width; col++) {
        for (var row = 0; row < Crafty.game.map_grid.height; row++) {
            if (Math.random() < 0.02) {
                if (Crafty('Village').length < max_villages && !this.occupied[col][row]) {
                    Crafty.e('Village').at(col, row);
                }
            }
        }
    }

    // Show the victory screen once all villages are visisted
    this.show_victory = this.bind('VillageVisited', function() {
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

// Victory scene
// -------------
// Tells the player when they've won and lets them start a new game
Crafty.scene('Victory', function() { 'use strict';
    // Display some text in celebration of the victory
    Crafty.e('2D, DOM, Text').attr({
        x : 0,
        y : 0
    }).text('Victory!');

    // Watch for the player to press a key, then restart the game
    //  when a key is pressed
    this.restart_game = this.bind('KeyDown', function() {
        Crafty.scene('Game');
    });
}, function() { 'use strict';
    // Remove our event binding from above so that we don't
    //  end up having multiple redundant event watchers after
    //  multiple restarts of the game
    this.unbind('KeyDown', this.restart_game);
});

// Loading scene
// -------------
// Handles the loading of binary assets such as images and audio files
Crafty.scene('Loading', function() { 'use strict';

    var assets = ['Assets/cscGarden01-32X32.png', 'Assets/BoyWalk.png', 'Assets/door_knock_3x.mp3'];

    // Load our sprite map image
    Crafty.load(assets, function() {

        Crafty.sprite(32, assets[0], {
            spr_tree : [0, 0],
            spr_bush : [1, 2],
            spr_village : [0, 1]
        });

        // Define the PC's sprite to be the first sprite in the third row of the
        //  animation sprite map
        Crafty.sprite(32, assets[1], {
            spr_player : [0, 0],
        }, 0, 2);

        // Define our sounds for later use
        //Crafty.audio.add({
        //	knock: ['http://desolate-caverns-4829.herokuapp.com/assets/door_knock_3x.mp3']
        //});

        // Draw some text for the player to see in case the file
        //  takes a noticeable amount of time to load
        Crafty.e('2D, DOM, Text').attr({
            x : 0,
            y : Crafty.game.height() / 2 - 24,
            w : Crafty.game.width()
        }).text('Loading...');

        // Now that our sprites are ready to draw, start the game
        Crafty.scene('Game');
    });
});

/* window.onload = function() {
 Crafty.game.start();
 }; */