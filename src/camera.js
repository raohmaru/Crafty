/**
 * Camera
 * ~~~~~~~~~~~~~~
 * 
 * The camera is a viewport into the game world. 
 * 
 * Moving the camera: 
 * 	Cameras have an X and Y, which map to different game world values based on the camera type. These values represent the space between the standard 0,0 view and current position.
 *  Increasing X will pan the viewport to the right. 
 *  Increasing Y will pan the viewport down.
 *
 * Camera types:
 * 	Cameras have several types they can be, which affects how they render the game world.
 *	Types:
 *		Top - Renders the world in a top-down, birds-eye view. Orthographic
 *		Side - Renders the world from the side, like Mario. Orthographic
 *		Isometric - Renders the world from a 45 degree angle. Tiles exist as single sprites. (FF Tactics) Orthographic
 *		IsometricFaces - Renders the world from a 45 degree angle. Tiles exist as boxes with different sprites for the sides (Minecraft) Orthographic
 *		3DSquare - Renders the world in full 3D, using DOM or SVG elements to create the world itself. All objects exist as faces. (ex. A cube would be 6 DOM elements.) Perspective
 *		3DCanvas - Renders the world using WebGL. Support for this is lacking in browsers, so it isn't recommended. Perspective.
 *
 * Camera Options:
 *	Cameras accept an optional object containing options to change from defaults.
 *  Parameters:
 *		canvas: boolean - force all rendering onto a Canvas. Has no affect in browsers that do not support canvas
 *		layers: key => value pairs - contains options on what to do with layers. Use null to not render a layer and a float to represent the speed the layer should move relative to the camera
 *
 * 3D and Layers:
 * Layers are less useful in 3D games, although they can still serve some function in keeping UI elements on top of game world elements
 * In a 3D game, all layers should be set to 0.0, since the Camera is positioned in the world, and moving layers around doesn't make sense.
 */
(function (Crafty) {
	Crafty.extend({
		camera: function (label, type, options) {
			return Crafty.camera[label] = new Crafty.camera.fn.init(type, options);
		}
	});
	
	Crafty.camera.fn = {
		active: false,
		x: 0,
		y: 0,
		z: 0,
		type: "",
		changed: true,
		canvas: false,
		/**
		 * Constructor. Should never be invoked directly.
		 */
		init: function(type, options) {
			this.type = type;
			this.data = {};
			this.target = {
				x: 0,
				y: 0,
				z: 0
			};
			this.layers = {};
			if ("canvas" in options) this.canvas = options.canvas;
			if ("layers" in options) {
				for (var l in options.layers) {
					this.layers[l] = {
						ratio: options.layers[l],
						x: 0,
						y: 0,
					};
				}
			}
		},
		
		/**
		 * Moves the camera 
		 */
		move: function (x, y, z) {
			this.moveTo(this.x + x, this.y + y, this.z + z);
			return this;
		},
		
		moveTo: function (x, y, z) {
			if (isFinite(x)) this.x = parseInt(x);
			if (isFinite(y)) this.y = parseInt(y);
			if (isFinite(z)) this.z = parseInt(z);
			for (var l in this.layers) {
				var la = this.layers[l];
				la.x = this.x * la.ratio;
				la.y = this.y = la.ratio;
			}
			return this;
		},
		
		getEntitiesInView: function() {
			var es = Crafty("Spatial"),
				arr = [];
			for (var i=0, l=es.length; i<l; i++) {
				arr.push(Crafty(es[i]));
			}
			return arr;
		},
		
		render: function () {
			if (!this.active) return;
			// pre render logic
			var entities = this.getEntitiesInView(),
				i = 0, l = entities.length,
				data = {};
			
			for (; i<l; i++) {
				var e = entities[i],
					d = {
						top: {
							paint: null,
							dimensions: null,
						},
					};
				e.trigger('PreRender', this.type, d);
				data[e[0]] = d;
			}
			
			// javascript! 
			// call the private functions as instance methods
			switch (this.type) {
				case "Top": 
					topdown.call(this, data);
					break;
				case "Side":
					sideview.call(this, data);
					break;
				case "Isometric":
					isometric.call(this, data);
					break;
				case "IsometricFaces":
					isofaces.call(this, data);
					break;
				case "3DSquare":
					dom3D.call(this, data);
					break;
				case "3DFull":
					full3D.call(this, data);
					break;
			}

			return this;
		}
	};
	Crafty.camera.fn.init.prototype = Crafty.camera.fn;
			
	// render implementations go here
	function topdown(data) {
	}
	
	function sideview(data) {
	}
	
	function isometric(data) {
	}
	
	function isofaces(data) {
	}
	
	function dom3D(data) {
	}
	
	function full3D(data) {
	}
	
	function Face() {
		this.paint = "";
		this.x = 0;
		this.y = 0;
		this.h = 0;
		this.w = 0;
	}
	
	Face.prototype.addPaint(new_rule) {
		this.paint += " "+new_rule;
	}
})(Crafty);