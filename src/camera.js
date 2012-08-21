/// camera.js
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
			
			//init redraw display
			if (Crafty.support.enableRedrawDisplay) {
				var redraws = document.createElement("canvas");
				redraws.width = Crafty.viewport.width;
				redraws.height = Crafty.viewport.height;
				redraws.style.position = 'absolute';
				redraws.style.zIndex = 10000;
				document.getElementById('cr-stage').insertBefore(redraws, document.getElementById('cr-stage').firstChild);
				Crafty.redraws = redraws.getContext("2d");
			}

			return Crafty.camera.cameras[label] = new Crafty.camera.fn.init(type, label, options);
		}
	});

	Crafty.camera.cameras = {};

	Crafty.camera.listActive = function() {
		var activeCams = { }, cameras = Crafty.camera.cameras;
		for (var c in cameras) {
			if (cameras[c].active) {
				activeCams[c] = cameras[c];
			}
		}
		return activeCams;
	};

	Crafty.camera.fn = {
		active: false,
		label: null,
		x: 0,
		y: 0,
		z: 0,
		type: "",
		changed: true,
		canvas: null,
		dom: null,
		/**
		 * Constructor. Should never be invoked directly.
		 */
		init: function (type, label, options) {
			this.type = type;
			this.label = label;
			this.data = {};
			this.target = {
				x: 0,
				y: 0,
				z: 0
			};
			this.layers = {};
			if ("canvas" in options) {
				this.canvas = document.createElement('canvas');
				this.canvas.id = 'camera_'+label;
				this.canvas.width = options.width;
				this.canvas.height = options.height;
				Crafty.stage.addChild(this.canvas);
			} 
			else {
				// creates the viewport elements
				this.dom = document.createElement('div');
				this.dom.id = 'camera_'+label;
				this.dom.style.width = options.width;
				this.dom.style.height = options.height;
				Crafty.stage.addChild(this.dom);
			}
			if ("layers" in options) {
				for (var l in options.layers) {
					this.layers[l] = {
						ratio: options.layers[l],
						x: 0,
						y: 0,
					};
					if (this.dom) {
						var layer = document.createElement('div');
						layer.id = 'camera-'+label+'-'+layer;
						this.dom.addChild(layer);
						this.layers[l].dom = layer;
					}
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
				la.y = this.y * la.ratio;
			}
			return this;
		},

		getEntitiesInView: function () {
			//TODO: Only return entities in view (by fiddling with the viewport)
			//TODO: cache the list of entities (keeping track of moving entities, change in viewport)

			return Crafty.select("Dirty");

		},

		render: function () {
			if (!this.active) {
				return this;
			}

			var dirtyData = { };

			// pre render logic
			var entities = Crafty.dirty,
				i = 0, l = entities.length;

			for (; i < l; i++) {
				var e = entities[i],
					
					// create an html element if one doesn't exist and the camera is using the dom to render
					elem = (this.dom && !this.dom.getElementById('entity-'+e[0]))?document.createElement('div'):this.canvas,
					// if the data object already exists for this entity, use it
					// otherwise, create a new one
					// this data object only represents the faces as data
					// it contains no objects related to the actual rendering (i.e. DOM elements)
					d = this.data[e[0]] || {
						faces: {
							top: (new Face(elem)).setFacing('top', e.w, e.l, e.h),
							front: (new Face(elem)).setFacing('front', e.w, e.l, e.h),
							left: (new Face(elem)).setFacing('left', e.w, e.l, e.h),
							right: (new Face(elem)).setFacing('right', e.w, e.l, e.h),
							back: (new Face(elem)).setFacing('back', e.w, e.l, e.h),
							below: (new Face(elem)).setFacing('below', e.w, e.l, e.h),
						},
						dirtySpatial: true
					};

				// some things to run the first time the data is built
				if (!this.data[e[0]]) {
					this.data[e[0]] = d;
					elem.id = 'entity-'+e[0];
					this.dom.getElementById('camera-'+this.label+'-'+e.layer).addChild(elem);
				}
				dirtyData[e[0]] = d;

				// As to not apply styles when nothing has changed. This really speeds rendering up!
				// Point in case: RPG demo improved from 200ms to 40 ms pr rendering.
				function generateRenderHash(face) {
					var hash = face.x + " " + face.y + " " + face.l + " " + face.w + " " + face.content;
					for (var name in face.paint) {
						hash += name + face.paint[name];
					}
					return hash;
				}

				//var renderHash = generateRenderHash(d.faces.front);

				// the entity gets its own data passed into it
				// a good entity will modify this data only if its been changed
				e.trigger('PreRender', { type: this.type, data: d });
				//d.dirty = renderHash != generateRenderHash(d.faces.front);

			}

			Crafty.dirty = [];

			// javascript! 
			// call the private functions as instance methods
			switch (this.type) {
				case "Top":
					topdown.call(this, this.data);
					break;
				case "Side":
					sideview.call(this, dirtyData);
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
			//console.log(data[e]);
			if (!data[e].dirty) {
				continue;
			}

			var top = data[e].faces.top;
			top.render();
			//updateSpatialStyles(data[e].html.container, top.x, top.y, top.z);
			//updateFaceStyle(data[e].html.top, top.paint, top.content, top.w, top.h);
			//console.log("Render TOP");
		}
		
	}

	/**
	 * Only renders the right face
	 */
	function sideview(data) {

		

		//if(Crafty.redraws) {
		//	Crafty.redraws.clearRect(0, 0, Crafty.viewport.width, Crafty.viewport.height);
		//}
		//var count = 0;
		for (var e in data) {
			//count++;
			var face = data[e].faces.right;
			//if (face.dirty) {
				updateSpatialStyles(data[e].html.container, face.x, face.y, face.z);
				updateFaceStyle(data[e].html.right, face.paint, face.content, face.w, face.h);
				//face.dirty = false;

				//if(Crafty.redraws) {
					
				//	Crafty.redraws.fillStyle = "rgba(0, 0, 200, 1)";
				//	Crafty.redraws.fillRect(face.x, face.y, face.w, face.h);
				//}

			//}
		}
		//console.log(count);
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
		// reposition the camera
		
		// redraw entities
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
	function Face(elem) {
		this.paint = {};
		this.content = "";
		this.x = 0;
		this.y = 0;
		this.z = 0;
		this.h = 0;
		this.w = 0;
		this.rZ = 0;
		this.rX = 0;
		this.dirty = true;
		this.facing = 'top';
		this.render_target = elem;
	}

	/**
    * @sign public void Face.sePaint(String name, String value)
	* @param name - the css name (ie. "background-color")
    * @param value - the css value (ie. "red")
	 * Paints are just css rules.
	 * Components should be as specific as possible to avoid collisions
	 * and odd behavior due to the order things happen
	 * eg. Sprite will add background-url and background-position
	 * Color will add background-color.
	 */
	Face.prototype.addPaint = function (name, value) {
		//if(this.paint[name] != value) {
		//	this.dirty = true;
		//}
		
		this.paint[name] = value;
		return this;
	};

	Face.prototype.setContent = function (content) {
		//if(this.content != content) {
		//	this.dirty = true;
		//}
		
		this.content = content;
	};

	/**
	 * Helper function
	 * Automatically sizes and orients a face based on the entity dimensions and the direction given
	 * w, l, h refer to the entity's dimensions. Face dimensions and position should be derived from these.
	 * Origin for transformation is always dead center
	 *		topdown view: 
	 *            back
	 *             ^
	 *             |
	 *           -----
	 *          |     |
	 *  right <-|    l|-> left
	 *          |  w  |
	 *           -----          
	 *             |            Y
	 *             V            
	 *           front          v>   X
	 */
	Face.prototype.setFacing = function (facing, w, l, h) {
		this.facing = facing.toLowerCase();
		switch (facing.toLowerCase()) {
			case 'top':
				this.w = w;
				this.h = l;
				this.z = parseInt(h);
				this.x = parseInt(w / 2);
				this.y = parseInt(l / 2);
				break;
			case 'front':
				this.w = w;
				this.h = h;
				this.rZ = 90;
				this.rX = 90;
				this.x = parseInt(w / 2);
				this.y = parseInt(l);
				this.z = parseInt(h / 2);
				break;
			case 'left':
				this.w = l;
				this.h = h;
				this.rX = 90;
				this.x = parseInt(w);
				this.y = parseInt(l / 2);
				this.z = parseInt(h / 2);
				break;
			case 'right':
				this.w = l;
				this.h = h;
				this.rX = -90;
				this.x = 0;
				this.y = parseInt(l / 2);
				this.z = parseInt(h / 2);
				break;
			case 'back':
				this.w = w;
				this.h = h;
				this.rZ = 90;
				this.rX = -90;
				this.x = parseInt(w / 2);
				this.y = 0;
				this.z = parseInt(h / 2);
				break;
			case 'below':
				this.w = w;
				this.h = l;
				this.x = parseInt(w / 2);
				this.y = parseInt(l / 2);
				this.z = -1 * h;
				this.rX = 180;
				break;
		}
		return this;
	};
	
	Face.prototype.draw = function () {
		// This function will need the actual offset from the canvas, based on all its ancestor containers.
		// TODO: Implement canvas stuff.
		if (this.render_target.nodeName == 'CANVAS') {
			
		}
		else {
			var id = 'entity-'+this.render_target.getAttribute('data-entity-id')+'-face-'+this.facing,
				elem = this.render_target.getElementById(id),
				trans = '', style = [];
			if (!elem) {
				elem = document.createElement('div');
				elem.id = id;
				this.render_target.addChild(elem);
				elem.className = this.facing;
			}
			// these are easier to do by manipulating the style object directly
			// it's only difficult to do because each transform is still vendor-prefixed
			if (Crafty.support.css3dtransform) {
				trans = 'translate3d('+face.x+', '+face.y+', '+face.z+') rotateZ('+face.rZ+") rotateX("+face.rX+")";
			}
			else {
				trans = 'translate('+face.x+', '+face.y+')';
			}
			
			style[style.length] = 'position: absolute;';
			style[style.length] = 'top: '+(-this.l/2)+'px;';
			style[style.length] = 'left: '+(-this.w/2)+'px;';
			style[style.length] = 'width: '+(this.w)+'px;';
			style[style.length] = 'height: '+(this.h)+'px;';
			for (var name in paint) {
				style[style.length] = name + ": " + paint[name] + ";";
			}
			if (typeof (elem.style.cssText) != 'undefined') {
				elem.style.cssText = style.implode(' ');
			}
			else {
				elem.setAttribute('style', style.implode(' '));
			}
			elem.style.transform = elem.style[crafty.support.prefix+"Transform"] = trans;
		}
	};

	function createDomElements(id, layer_elemn) {
		var container = document.createElement('div');
		container.id = "ent" + id;

		var top = document.createElement('div');
		top.id = "ent" + id + "-top";
		container.appendChild(top);

		var front = document.createElement('div');
		front.id = "ent" + id + "-front";
		container.appendChild(front);

		var right = document.createElement('div');
		right.id = "ent" + id + "-right";
		container.appendChild(right);

		layer_elem.appendChild(container);

		return { container: container, top: top, front: front, right: right };
	}

	// Modifies spatial attributes of the container div. Is called by one of the render functions,
	// which is responsible of mapping the face values to the screen
	function updateSpatialStyles(elem, x, y, z) {
		var style = "position:absolute; ",
			prefix = "-" + Crafty.support.prefix + "-",
			trans = [];

		//utilize CSS3 if supported
		if (Crafty.support.css3dtransform) {
			trans.push("translate3d(" + (~~x) + "px," + (~~y) + "px,0)");
		} else {
			style += ("left: " + ~~(x) + "px;");
			style += ("top: " + ~~(y) + "px;");
		}

		style += ("zIndex: " + ~~(z) + ";");

		if (trans.length > 0) {
			style += ("transform: " + trans.join(" ") + ";");
			style += (prefix + "transform: " + trans.join(" ") + ";");
		}

		////if (typeof (elem.style.cssText) != 'undefined') {
		//	elem.style.cssText = style;
		//} else {
			elem.setAttribute('style', style);
		//}
	}

	function updateFaceStyle(elem, paint, content, w, h) {
		var style = "";
		for (var name in paint) {
			style += name + ": " + paint[name] + ";";
		}
		style += ("width: " + ~~(w) + "px;") + ("height: " + ~~(h) + "px;");

		//if (typeof (elem.style.cssText) != 'undefined') {
		//	elem.style.cssText = style;
		//} else {
			elem.setAttribute('style', style);
		//}

			if (content) {
				elem.innerHTML = content;
			}
	}

})(Crafty);