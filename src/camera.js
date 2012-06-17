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
 *		canvas: boolean - force all rendering onto a Canvas. Has no affect in browsers that do not support canvas/
 *			Aside: I'm wondering whether we should let developers choose this at all. Pure DOM is faster, so unless they need something DOM has no way of handling, we should stick to it
 *		layers: key => value pairs - contains options on what to do with layers. Use null to not render a layer and a float to represent the speed the layer should move relative to the camera
 *
 * 3D and Layers:
 * Layers are less useful in 3D games, although they can still serve some function in keeping UI elements on top of game world elements
 * In a 3D game, all layers should be set to 0.0, since the Camera is positioned in the world, and moving layers around doesn't make sense.
 */
(function (Crafty) {
	Crafty.extend({
	// Either creates a camera, or returns the camera with the given label. 
	// I think this is better than the array syntax Crafty.camera[], as it allows us to iterate over Crafty.camera.cameras 
	// without having to deal with functions on Crafty.camera. Agree?
		camera: function (label, type, options) {
			if (!type) {
				return Crafty.camera.cameras[label];
			}
			
			return Crafty.camera.cameras[label] = new Crafty.camera.fn.init(type, options);
		}
	});

	Crafty.camera.cameras = {};

	Crafty.camera.listActive = function () {
		var activeCams = {}, cameras = Crafty.camera.cameras;
		for (var c in cameras) {
			if (cameras[c].active) {
				activeCams[c] = cameras[c];
			}
		}
		return activeCams;
	}
	
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
			var es = Crafty("Render"),
				arr = [];
			for (var i=0, l=es.length; i<l; i++) {
				arr.push(Crafty(es[i]));
			}
			console.log("In View: ")
			console.log(es);
			return arr;
		},
		
		render: function () {
			if (!this.active) return;
			// pre render logic
			var entities = this.getEntitiesInView(),
				i = 0, l = entities.length;
			
			for (; i<l; i++) {
				var e = entities[i],
					// if the data object already exists for this entity, use it
					// otherwise, create a new one
					// this data object only represents the faces as data
					// it contains no objects related to the actual rendering (i.e. DOM elements)
					d = this.data[e[0]] || {
						faces: {
							top: (new Face()).setFacing('top', e.w, e.l, e.h, e.x, e.y),
							front: (new Face()).setFacing('front', e.w, e.l, e.h),
							left: (new Face()).setFacing('left', e.w, e.l, e.h),
							right:(new Face()).setFacing('right', e.w, e.l, e.h),
							back: (new Face()).setFacing('back', e.w, e.l, e.h),
							below: (new Face()).setFacing('below', e.w, e.l, e.h),
						},
						tag: 'div',
						html: {
							top: createDomElement('div', e[0] + '-top')
						}
					};

				if (!this.data[e[0]]) {
					this.data[e[0]] = d;
				}

				// the entity gets its own data passed into it
				// a good entity will modify this data only if its been changed
				e.trigger('PreRender', { type: this.type, data: d });
			}
			
			// javascript! 
			// call the private functions as instance methods
			switch (this.type) {
				case "Top": 
					topdown.call(this, this.data);
					break;
				case "Side":
					sideview.call(this, this.data);
					break;
				case "Isometric":
					isometric.call(this, this.data);
					break;
				case "IsometricFaces":
					isofaces.call(this, this.data);
					break;
				case "3DSquare":
					dom3D.call(this, this.data);
					break;
				case "3DFull":
					full3D.call(this, this.data);
					break;
			}

			return this;
		}
	};
	Crafty.camera.fn.init.prototype = Crafty.camera.fn;
			
	// render implementations go here
	/**
	 * All render implementations should work in the same general way
	 * For each entity that needs drawing,
	 * 	it should loop through the entities list of faces
	 *  and draw them based on the parameters of the face
	 *  and the entity itself
	 
	 * If an implementation only needs to make use of one face,
	 * the implementation should handle this accordingly.
	 
	 * Each function needs to take care of its own cleanup. 
	 * Any elements on screen that shouldn't be (deleted, w/e)
	 * need to be removed by the function itself.
	 */
	
	/**
	 * Only renders the top face of each box
	 */
	function topdown(data) {
		for (var e in data) {
			console.log(data[e]);
			drawDOM(data[e].html.top, data[e].faces.top);
			console.log("Render TOP");
		}
	}
	
	/**
	 * Only renders the right face
	 */
	function sideview(data) {
	}
	
	/**
	 * Only renders the front face. The front face should already have the isometric transforms applied to it in the sprite itself
	 */
	function isometric(data) {
	}
	
	/**
	 * Renders all 6 faces. The camera is at a fixed angle, with no perspective applied
	 */
	function isofaces(data) {
	}
	
	/**
	 * Renders all 6 faces. Camera can be anywhere. Has perspective.
	 */
	function dom3D(data) {
	}
	
	/**
	 * Renders all 6 faces with WebGL. Camera can be anywhere. Has perspective.
	 * Good luck with this one. I ain't touching it.
	 */
	function full3D(data) {
	}
	
	/**
	 * Represents a single face of a larger object.
	 * A face is defined a rectangle in which all 4 points are on the same plane
	 * For instance, a cube is made up of 6 faces. 
	 * By default, all Spatial entities are cubes
	 * Other components can change this.
	 */
	function Face() {
		this.paint = "";
		this.x = 0;
		this.y = 0;
		this.z = 0;
		this.h = 0;
		this.w = 0;
		this.rZ = 0;
		this.rX = 0;
	}
	
	/**
	 * Paints are just css rules.
	 * Components should be as specific as possible to avoid collisions
	 * and odd behavior due to the order things happen
	 * eg. Sprite will add background-url and background-position
	 * Color will add background-color.
	 */
	Face.prototype.addPaint = function(new_rule) {
		this.paint += " "+new_rule + ";";
		return this;
	}
	
	/**
	 * Helper function
	 * Automatically sizes and orients a face based on the entity dimensions and the direction given
	 */
	Face.prototype.setFacing = function(facing, w, l, h, x, y) {
		switch (facing.toLowerCase()) {
			case 'top':
				this.w = w;
				this.h = l;
				this.z = parseInt(h / 2);
				this.x = x;
				this.y = y;
			break;
			case 'front':
				this.w = h;
				this.h = l;
				this.rX = 90;
			break;
			case 'left':
				this.w = h;
				this.h = w;
				this.rZ = 90;
				this.rX = 90;
			break;
			case 'right':
				this.w = h;
				this.h = w;
				this.rZ = 90;
				this.rX = -90;
			break;
			case 'back':
				this.w = h;
				this.h = l;
				this.rX = -90;
			break;
			case 'below':
				this.w = w;
				this.h = l;
				this.rX = 180;
			break;
		}
		return this;
	}

	function createDomElement(elementType, id) {
		var domElement = document.createElement(elementType);
		Crafty.stage.inner.appendChild(domElement);
		domElement.style.position = "absolute";
		domElement.id = "ent" + id;
		return domElement;
	}
	
	function drawDOM(elem, face) {
		console.log("drawDom")
		console.log(elem);
		console.log(face);
		var style = "position:absolute; " + face.paint,
			coord = [face.x, face.y, face.w, face.h],
			co = { x: coord[0], y: coord[1] },
			prefix = "-" + Crafty.support.prefix + "-",
			trans = [];

		//if (!this._visible) style.visibility = "hidden";
		//else style.visibility = "visible";

		//utilize CSS3 if supported
		if (Crafty.support.css3dtransform) {
			trans.push("translate3d(" + (~~face.x) + "px," + (~~face.y) + "px,0)");
		} else {
			style += ("left: " + ~~(face.x) + "px;");
			style += ("top: " + ~~(face.y) + "px;");
			}


			

		style += ("width: " + ~~(face.w) + "px;");
		style += ("height: " + ~~(face.h) + "px;");
		style += ("zIndex: " + ~~(face.z) + ";");

		

		//style.opacity = this._alpha;
		//style[prefix + "Opacity"] = this._alpha;

		//if not version 9 of IE
		//if (prefix === "ms" && Crafty.support.version < 9) {
		//	//for IE version 8, use ImageTransform filter
		//	if (Crafty.support.version === 8) {
		//		this._filters.alpha = "progid:DXImageTransform.Microsoft.Alpha(Opacity=" + (this._alpha * 100) + ")"; // first!
		//		//all other versions use filter
		//	} else {
		//		this._filters.alpha = "alpha(opacity=" + (this._alpha * 100) + ")";
		//	}
		//}

		//if (this._mbr) {
		//	var origin = this._origin.x + "px " + this._origin.y + "px";
		//	style.transformOrigin = origin;
		//	style[prefix + "TransformOrigin"] = origin;
		//	if (Crafty.support.css3dtransform) trans.push("rotateZ(" + this._rotation + "deg)");
		//	else trans.push("rotate(" + this._rotation + "deg)");
		//}

		//if (this._flipX) {
		//	trans.push("scaleX(-1)");
		//	if (prefix === "ms" && Crafty.support.version < 9) {
		//		this._filters.flipX = "fliph";
		//	}
		//}

		//if (this._flipY) {
		//	trans.push("scaleY(-1)");
		//	if (prefix === "ms" && Crafty.support.version < 9) {
		//		this._filters.flipY = "flipv";
		//	}
		//}

		//apply the filters if IE
		//if (prefix === "ms" && Crafty.support.version < 9) {
		//	this.applyFilters();
		//}

		if (trans.length > 0) {
			style += ("transform: " + trans.join(" ") + ";");
			style += (prefix + "transform: " + trans.join(" ") + ";");
		}

		//style.transform = trans.join(" ");
		//style[prefix + "Transform"] = trans.join(" ");

		//this.trigger("Draw", { style: style, type: "DOM", co: co });

		console.log(style);

		if (typeof(elem.style.cssText) != 'undefined') {
			elem.style.cssText = style;
		} else {
			elem.setAttribute('style', style);
		}
	}
})(Crafty);