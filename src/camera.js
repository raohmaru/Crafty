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
 * 
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
			return this;
		},
		
		render: function () {
			if (!this.active) return;
			// pre render logic
			var data;
			
			switch (this.type) {
				case "Top": 
					topdown(data);
					break;
				case "Side":
					sideview(data);
					break;
				case "Isometric":
					isometric(data);
					break;
				case "IsometricFaces":
					isofaces(data);
					break;
				case "3DSquare":
					dom3D(data);
					break;
				case "3DFull":
					full3D(data);
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
})(Crafty);