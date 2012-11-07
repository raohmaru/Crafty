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
		active: true,
		label: null,
		x: 0,				// actual position (in world)
		y: 0,
		z: 0,
		diff: null,			// change in position since last frame
		type: "",
		changed: true,
		canvas: null,
		dom: null,			// the dom tree in use
		/**
		 * Constructor. Should never be invoked directly.
		 */
		init: function (type, label, options) {
			this.type = type;
			this.label = label;
			this.data = {};
			this.diff = {
				x: 0,
				y: 0,
				z: 0
			}
			this.target = {
				x: 0,
				y: 0,
				z: 0
			};
			this.layers = {};
			if ("canvas" in options && options.canvas) {
				this.canvas = document.createElement('canvas');
				this.canvas.id = 'camera_'+label;
				this.canvas.width = options.width;
				this.canvas.height = options.height;
				Crafty.stage.elem.appendChild(this.canvas);
			} 
			else {
				// creates the viewport elements
				this.dom = document.createElement('div');
				this.dom.id = 'camera_'+label;
				this.dom.className = (['camera', type, label]).join(' ');
				this.dom.style.width = options.width;
				this.dom.style.height = options.height;
				Crafty.stage.elem.appendChild(this.dom);
			}
			if ("layers" in options) {
				for (var l in options.layers) {
					this.layers[l] = {
						ratio: options.layers[l].ratio,
						x: options.layers[l].x,
						y: options.layers[l].y,
						flat: typeof options.layers[l].flat != 'undefined'?options.layers[l].flat:true
					};
					if (this.dom) {
						var layer = document.createElement('div');
						layer.id = 'camera-'+label+'-'+l;
						layer.className = 'layer'+(!this.layers[l].flat?' threeD':'');
						this.dom.appendChild(layer);
						this.layers[l].dom = layer;
					}
				}
			}
	
			// add common styles
			Crafty.style.add('.obj', 'position', 'absolute');
			Crafty.style.add('.obj', '-webkit-transform-style', 'preserve-3d');
			Crafty.style.add('.obj', '-moz-transform-style', 'preserve-3d');
			Crafty.style.add('.obj', '-o-transform-style', 'preserve-3d');
			Crafty.style.add('.obj', '-ms-transform-style', 'preserve-3d');
			Crafty.style.add('.obj', 'transform-style', 'preserve-3d');
			
			Crafty.style.add('.Face', 'position', 'absolute');
			Crafty.style.add('.Face', 'border', '3px solid black');
			Crafty.style.add('.layer', 'position', 'absolute');
			Crafty.style.add('.camera', {position: 'absolute', width: '100%', height: '100%'});
			
			var three_d_wrapper = {};
			three_d_wrapper['-webkit-perspective'] = '1000px';
			three_d_wrapper['-moz-perspective'] = '1000px';
			three_d_wrapper['-o-perspective'] = '1000px';
			three_d_wrapper['-ms-perspective'] = '1000px';
			three_d_wrapper['perspective'] = '1000px';
			Crafty.style.add('.camera.ThreeDSquare', three_d_wrapper);
			Crafty.style.add('.camera.IsometricFaces', three_d_wrapper);
			
			var three_d_container = {};
			three_d_container['-webkit-transform-style'] = 'preserve-3d';
			three_d_container['-moz-transform-style'] = 'preserve-3d';
			three_d_container['-o-transform-style'] = 'preserve-3d';
			three_d_container['-ms-transform-style'] = 'preserve-3d';
			three_d_container['transform-style'] = 'preserve-3d';
			three_d_container['top'] = '50%';
			three_d_container['left'] = '50%';
			Crafty.style.add('.camera.ThreeDSquare .layer.threeD', three_d_container);
			Crafty.style.add('.camera.IsometricFaces', three_d_container);
		},

		/**
		 * Moves the camera 
		 */
		move: function (x, y, z, reset) {
			if (arguments.length == 3) {
				reset = false;
			}
			if (reset) {
				this.diff.x = 0;
				this.diff.y = 0;
				this.diff.z = 0;
			}
			
			this.diff.x += x >> 0;
			this.diff.y += y >> 0;
			this.diff.z += z >> 0;
			this.changed = true;

			return this;
		},

		moveTo: function (x, y, z) {
			this.move(this.x - x, this.y - y, this.z - z, true);
			return this;
		},

		getEntitiesInView: function () {
			//TODO: Only return entities in view (by fiddling with the viewport)
			//TODO: cache the list of entities (keeping track of moving entities, change in viewport)

			return Crafty.select("Spatial");

		},

		render: function () {
			if (!this.active) {
				return this;
			}

			// pre render logic
			var entities = this.getEntitiesInView(),
				toDelete = {},
				i = 0, l = entities.length;
			
			for (i in this.data) {
				toDelete[i] = true;
			}

			for (i = 0; i < l; i++) {
				var e = entities[i],
					
					// create an html element if one doesn't exist and the camera is using the dom to render
					elem = (this.dom && !this.dom.querySelector('#entity-'+e[0]))?document.createElement('div'):this.canvas,
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
						old: {}
					};

				// some things to run the first time the data is built
				if (!this.data[e[0]]) {
					this.data[e[0]] = d;
					elem.id = 'entity-'+e[0];
					elem.setAttribute('data-entity-id', e[0]);
					elem.style.position = 'absolute';
					this.dom.querySelector('#camera-'+this.label+'-'+e.layer).appendChild(elem);
				}
				else {
					delete toDelete[e[0]];
				}
				// the entity gets its own data passed into it
				// a good entity will modify this data only if its been changed
				e.trigger('PreRender', { type: this.type, data: d });
			}
			
			// Remove any html elements this entity has
			for (i in toDelete) {
				delete this.data[i];
				var del = this.dom.querySelector('#entity-'+i);
				if (del) {
					del.parentNode.removeChild(del);
				}
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
				case "ThreeDSquare":
					dom3D.call(this, this.data);
					break;
				case "ThreeDFull":
					full3D.call(this, this.data);
					break;
			}

			Crafty.dirty = [];
			this.changed = false;
			this.diff = {x: 0, y: 0, z: 0};
			return this;
		}
	};
	Crafty.camera.fn.init.prototype = Crafty.camera.fn;
	
	/**
	 * @param e_id  Unique entity id (should be integer as string)
	 * @param data  The rendering data for the entity only
	 * @param map	A map of camera to entity properties
	 */
	function entity_render(e_id, data, map) {
		var entity = Crafty(e_id >> 0),
			elem = this.dom.querySelector('#entity-'+e_id),
			dirty = data.old.x != entity.x 
				|| data.old.y != entity.y 
				|| data.old.z != entity.z
				|| data.old.rotation != entity.rotation
				|| data.old.components != entity.__c,
			transform = '';
		
		if (typeof map.z != 'undefined') {
			if (!Crafty.support.css3dtransform) {
				throw 'Your browser does not support 3D properties. Please upgrade to a more recent browser.';
			}
			else {
				transform = 'translate3d('+entity.x+'px, '+entity.y+'px, '+entity.z+'px) rotateZ('+entity.rotation+'deg)';
			}
		}
		else {
			transform = 'translate('+entity[map.x]+'px,'+entity[map.y]+'px) rotate('+entity.rotation+'deg)';
		}
			
		if (dirty) {
			var classes_changed = false,
				classes = [], i;
			if (!Crafty.support.classList) {
				if (typeof data.old.components == 'undefined') {
					data.old.components = {};
				}
				for (i in entity.__c) {
					if (typeof data.old.components[i] == 'undefined') {
						classes[classes.length] = i;
						data.old.components[i] = true;
						classes_changed = true;
					}
				}
				if (classes_changed) {
					elem.className = classes.join(' ');
				}
			}
			else {
				for (i in entity.__c) {
					elem.classList.add(i);
				}
			}
			elem.style.zIndex = entity.z;
			elem.style.top = (-0.5*entity.l)+'px';
			elem.style.left = (-0.5*entity.w)+'px';
			elem.style.transform = elem.style[Crafty.support.prefix+"Transform"] = transform;
			data.old.x = entity.x;
			data.old.y = entity.y;
			data.old.z = entity.z;
			data.old.rotation = entity.rotation;
		}
	}

	/**
	 * All render implementations should work in the same general way
	 * For each entity that needs drawing,
	 * 	it should loop through the entities list of faces
	 *  and draw them based on the parameters of the face
	 *  and the entity itself
	 
	 * If an implementation only needs to make use of one face,
	 * the implementation should handle this accordingly.
	 */

	/**
	 * Only renders the top face of each box
	 */
	function topdown(data) {
		if (this.changed) {
			for (var i in this.layers) {
				var l = this.layers[i],
					dom = this.dom.querySelector('#camera-'+this.label+'-'+i);
				l.x += this.diff.x*l.ratio;
				l.y += this.diff.y*l.ratio;

				dom.style.transform = dom.style[Crafty.support.prefix+'Transform'] = 'translate('+(-1*l.x)+'px, '+(-1*l.y)+'px)';
			}
			this.move(0, 0, 0, true);
			this.changed = false;
		}
		for (var e in data) {
			entity_render.call(this, e, data[e], {x: 'x', y: 'y'});
			
			var top = data[e].faces.top;
			top.render();
		}
		
	}

	/**
	 * Only renders the right face
	 */
	function sideview(data) {
		if (this.changed) {
			for (var i in this.layers) {
				var l = this.layers[i],
					dom = this.dom.querySelector('#camera-'+this.label+'-'+i);
				l.x += this.diff.y*l.ratio;
				l.y += this.diff.z*l.ratio;

				dom.style.transform = dom.style[Crafty.support.prefix+'Transform'] = 'translate('+(-1*l.x)+'px, '+(-1*l.y)+'px)';
			}
			this.move(0, 0, 0, true);
			this.changed = false;
		}
		
		for (var e in data) {
			entity_render.call(this, e, data[e], {x: 'y', y: 'z'});
			
			var face = data[e].faces.right;
			face.render();
		}
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
		// this will happen on the layer element
		
		if (this.changed) {
			// figure out the 3d transformations needed
			var vector = {
				x: this.target.x - (this.x += this.diff.x), 
				y: this.target.y - (this.y += this.diff.y), 
				z: this.target.z - (this.z += this.diff.z)
			},
			trans = {}, hyp;
			
			trans.origin = {};
			trans.origin.x = this.target.x;
			trans.origin.y = this.target.y;
			trans.origin.z = this.target.z;
			trans.form = [];
			trans.form.push({op: 'translateZ', val: [1000]});	// move the browser's viewpoint to 0,0,0
			trans.form.push({op: 'translate3d', val:[(-1*this.target.x), (-1*this.target.y), (-1*this.target.z)]});
			
			// figure out the x rotation based on the vector
			hyp = Math.sqrt(vector.x*vector.x + vector.y*vector.y + vector.z*vector.z);
			trans.form.push({op: 'rotateX', val:[90 + Crafty.math.radToDeg(Math.asin(vector.z/hyp))]});
			
			// figure out the z rotation based on the vector
			// this was tricky.
			// things to remember: 
			// the angle we want to measure has the camera at 0,0. so the vector needs to be reversed.
			// the coord grid is 90 degrees from what i expected, so x and y needed to be switched.
			trans.form.push({op: 'rotateZ', val:[(Crafty.math.radToDeg(Math.atan2(-vector.x, -vector.y)))]});
			
			// figure out the translation needed based on the vector
			trans.form.push({op: 'translate3d', val: [vector.x, vector.y, vector.z]});
			
			// add transformations to 3D space layers
			for (var i in this.layers) {
				var l = this.layers[i],
					dom = this.dom.querySelector('#camera-'+this.label+'-'+i),
					pref = Crafty.support.prefix, 
					i, style = [], unit, j, rot = /rotate/i, mov = /translate/i, scl = /scale/i, str;
				if (!l.flat) {
					dom.style.transformOrigin = dom.style[pref+"TransformOrigin"] = trans.origin.x+"px "+trans.origin.y+"px "+trans.origin.z+"px";
					for (i in trans.form) {
						j = trans.form[i];
						if (j.op.search(mov) != -1) {
							unit = 'px';
						}
						else if (j.op.search(rot) != -1) {
							unit = 'deg';
						}
						else if (j.op.search(scl) != -1) {
							unit = '';
						}
						
						for (var m in j.val) {
							j.val[m] = j.val[m]+unit;
						}
						style.push(j.op+'('+(j.val.join(', '))+')');
					}
					dom.style.transform = dom.style[pref+"Transform"] = style.join(' ');
				}
			}
			this.changed = false;
		}
		
		// redraw entities
		for (var e in data) {
			entity_render.call(this, e, data[e], {x: 'x', y: 'y', z: 'z'});
			
			for (var i in data[e].faces) {
				data[e].faces[i].render();
			}
		}
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
		if(this.paint[name] != value) {
			this.dirty = true;
		}
		
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
				this.z = h;
				this.x = (w / 2) >> 0;
				this.y = (l / 2) >> 0;
				break;
			case 'front':
				this.w = w;
				this.h = h;
				this.rZ = 0;
				this.rX = 90;
				this.x = (w / 2) >> 0;
				this.y = l;
				this.z = (h / 2) >> 0;
				break;
			case 'left':
				this.w = l;
				this.h = h;
				this.rZ = 90;
				this.rX = 90;
				this.x = w;
				this.y = (l / 2) >> 0;
				this.z = (h / 2) >> 0;
				break;
			case 'right':
				this.w = l;
				this.h = h;
				this.rZ = 90;
				this.rX = -90;
				this.x = 0;
				this.y = (l / 2) >> 0;
				this.z = (h / 2) >> 0;
				break;
			case 'back':
				this.w = w;
				this.h = h;
				this.rZ = 0;
				this.rX = -90;
				this.x = (w / 2) >> 0;
				this.y = 0;
				this.z = (h / 2) >> 0;
				break;
			case 'below':
				this.w = w;
				this.h = l;
				this.x = (w / 2) >> 0;
				this.y = (l / 2) >> 0;
				this.z = 0;
				this.rX = 180;
				break;
		}
		return this;
	};
	
	Face.prototype.render = function () {
		// This function will need the actual offset from the canvas, based on all its ancestor containers.
		// TODO: Implement canvas stuff.
		if (!this.dirty) return;
		if (this.render_target.nodeName == 'CANVAS') {
			
		}
		else {
			var id = 'entity-'+this.render_target.getAttribute('data-entity-id')+'-face-'+this.facing,
				elem = document.getElementById(id),
				trans = '', style = [];
			if (!elem) {
				elem = document.createElement('div');
				elem.id = id;
				this.render_target.appendChild(elem);
				elem.className = 'Face '+this.facing;
			}
			// these are easier to do by manipulating the style object directly
			// it's only difficult to do because each transform is still vendor-prefixed
			if (Crafty.support.css3dtransform) {
				trans = 'translate3d('+this.x+'px, '+this.y+'px, '+this.z+'px) rotateZ('+this.rZ+"deg) rotateX("+this.rX+"deg)";
			}
			else {
				trans = 'translate('+this.x+'px, '+this.y+'px)';
			}
			
			style[style.length] = 'top: '+(-this.h/2)+'px;';
			style[style.length] = 'left: '+(-this.w/2)+'px;';
			style[style.length] = 'width: '+(this.w)+'px;';
			style[style.length] = 'height: '+(this.h)+'px;';
			for (var name in this.paint) {
				style[style.length] = name + ": " + this.paint[name] + ";";
			}
			if (typeof (elem.style.cssText) != 'undefined') {
				elem.style.cssText = style.join(' ');
			}
			else {
				elem.setAttribute('style', style.join(' '));
			}
			elem.style.transform = elem.style[Crafty.support.prefix+"Transform"] = trans;
		}
		this.dirty=false;
	};
