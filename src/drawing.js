/**@
* #Sprite
* @category Graphics
* Component for using tiles in a sprite map.
*/
Crafty.c("Sprite", {			
	/**@
	* #.sprite
	* @comp Sprite
	* @sign public this .sprite(Number x, Number y, Number w, Number h)
	* @param x - X cell position 
	* @param y - Y cell position
	* @param w - Width in cells
	* @param h - Height in cells
	* Uses a new location on the sprite map as its sprite.
	*
	* Values should be in tiles or cells (not pixels).
	*/
	sprite: function(x,y,w,h) {
		this.__coord = [
			x * this.__tile + this.__padding[0] + this.__trim[0],
			y * this.__tileh + this.__padding[1] + this.__trim[1],
			this.__trim[2] || w * this.__tile || this.__tile,
			this.__trim[3] || h * this.__tileh || this.__tileh
		];
		
		return this;
	},
	
	/**@
	* #.crop
	* @comp Sprite
	* @sign public this .crop(Number x, Number y, Number w, Number h)
	* @param x - Offset x position
	* @param y - Offset y position
	* @param w - New width
	* @param h - New height
	* If the entity needs to be smaller than the tile size, use this method to crop it.
	*
	* The values should be in pixels rather than tiles.
	*/
	crop: function(x,y,w,h) {
		this.__trim = [];
		this.__trim[0] = x;
		this.__trim[1] = y;
		this.__trim[2] = w;
		this.__trim[3] = h;
		
		this.__coord[0] += x;
		this.__coord[1] += y;
		this.__coord[2] = w;
		this.__coord[3] = h;
		this._w = w;
		this._h = h;
		
		return this;
	}
});

/**@
* #Color
* @category Graphics
* Draw a solid color for the entity
*/
Crafty.c("Color", {
	_color: "",
	ready: true,
	
	init: function() {
		this.bind("Draw", function(e) {
			if(e.type === "DOM") {
				e.style.background = this._color;
				e.style.lineHeight = 0;
			} else if(e.type === "canvas") {
				if(this._color) e.ctx.fillStyle = this._color;
				e.ctx.fillRect(e.pos._x,e.pos._y,e.pos._w,e.pos._h);
			}
		});
	},
	
	/**@
	* #.color
	* @comp Color
	* @sign public this .color(String color)
	* @param color - Color of the rectangle
	* Will create a rectangle of solid color for the entity.
	*
	* The argument must be a color readable depending on how it's drawn. Canvas requires 
	* using `rgb(0 - 255, 0 - 255, 0 - 255)` or `rgba()` whereas DOM can be hex or any other desired format.
	*/
	color: function(color) {
		this._color = color;
		this.trigger("Change");
		return this;
	}
});

/**@
* #Tint
* @category Graphics
* Similar to Color by adding an overlay of semi-transparent color.
*
* *Note: Currently one works for Canvas*
*/
Crafty.c("Tint", {
	_color: null,
	_strength: 1.0,
	
	init: function() {
        var draw = function d(e) {
    		var context = e.ctx || Crafty.canvas.context;
			
			context.fillStyle = this._color || "rgb(0,0,0)";
			context.fillRect(e.pos._x, e.pos._y, e.pos._w, e.pos._h);
		};
        
		this.bind("Draw", draw).bind("RemoveComponent", function(id) {
            if(id === "Tint") this.unbind("Draw", draw);  
        });
	},
	
	/**@
	* #.tint
	* @comp Tint
	* @sign public this .tint(String color, Number strength)
	* @param color - The color in hexidecimal
	* @param strength - Level of opacity
	* Modify the color and level opacity to give a tint on the entity.
	*/
	tint: function(color, strength) {
		this._strength = strength;
		this._color = Crafty.toRGB(color, this._strength);
		
		this.trigger("Change");
		return this;
	}
});

/**@
* #Image
* @category Graphics
* Draw an image with or without repeating (tiling).
*/
Crafty.c("Image", {
	_repeat: "repeat",
	ready: false,
	
	init: function() {
        var draw = function(e) {
    		if(e.type === "canvas") {
				//skip if no image
				if(!this.ready || !this._pattern) return;
				
				var context = e.ctx;
				
				context.fillStyle = this._pattern;
				
				//context.save();
				//context.translate(e.pos._x, e.pos._y);
				context.fillRect(this._x,this._y,this._w, this._h);
				//context.restore();
			} else if(e.type === "DOM") {
				if(this.__image) 
					e.style.background = "url(" + this.__image + ") "+this._repeat;
			}
		};
        
		this.bind("Draw", draw).bind("RemoveComponent", function(id) {
            if(id === "Image") this.unbind("Draw", draw);  
        });
	},
	
	/**@
	* #image
	* @comp Image
	* @sign public this .image(String url[, String repeat])
	* @param url - URL of the image
	* @param repeat - If the image should be repeated to fill the entity.
	* Draw specified image. Repeat follows CSS syntax (`"no-repeat", "repeat", "repeat-x", "repeat-y"`);
	*
	* *Note: Default repeat is `no-repeat` which is different to standard DOM (which is `repeat`)*
	*
	* If the width and height are `0` and repeat is set to `no-repeat` the width and 
	* height will automatically assume that of the image. This is an 
	* easy way to create an image without needing sprites.
	* @example
	* Will default to no-repeat. Entity width and height will be set to the images width and height
	* ~~~
	* var ent = Crafty.e("2D, DOM, image").image("myimage.png");
	* ~~~
	* Create a repeating background.
	* ~~~
    * var bg = Crafty.e("2D, DOM, image")
	*              .attr({w: Crafty.viewport.width, h: Crafty.viewport.height})
	*              .image("bg.png", "repeat");
	* ~~~
	* @see Crafty.sprite
	*/
	image: function(url, repeat) {
		this.__image = url;
		this._repeat = repeat || "no-repeat";
		
		
		this.img = Crafty.assets[url];
		if(!this.img) {
			this.img = new Image();
			Crafty.assets[url] = this.img;
			this.img.src = url;
			var self = this;
			
			this.img.onload = function() {
				if(self.has("Canvas")) self._pattern = Crafty.canvas.context.createPattern(self.img, self._repeat);
				self.ready = true;
				
				if(self._repeat === "no-repeat") {
					self.w = self.img.width;
					self.h = self.img.height;
				}
				
				self.trigger("Change");
			};
			
			return this;
		} else {
			this.ready = true;
			if(this.has("Canvas")) this._pattern = Crafty.canvas.context.createPattern(this.img, this._repeat);
			if(this._repeat === "no-repeat") {
				this.w = this.img.width;
				this.h = this.img.height;
			}
		}
		
		
		this.trigger("Change");
		
		return this;
	}
});

Crafty.extend({
	_scenes: [],
	_current: null,
	
	/**@
	* #Crafty.scene
	* @category Scenes, Stage
	* @sign public void Crafty.scene(String sceneName, Function init)
	* @param sceneName - Name of the scene to add
	* @param init - Function execute when scene is played
	* @sign public void Crafty.scene(String sceneName)
	* @param sceneName - Name of scene to play
	* Method to create scenes on the stage. Pass an ID and function to register a scene. 
	*
	* To play a scene, just pass the ID. When a scene is played, all 
	* entities with the `2D` component on the stage are destroyed.
	*
	* If you want some entities to persist over scenes (as in not be destroyed) 
	* simply add the component `persist`.
	*/
	scene: function(name, fn) {
		//play scene
		if(arguments.length === 1) {
			Crafty("2D").each(function() {
				if(!this.has("persist")) this.destroy();
			}); //clear screen of all 2D objects except persist
			this._scenes[name].call(this);
			this._current = name;
			return;
		}
		//add scene
		this._scenes[name] = fn;
		return;
	},
	
	rgbLookup:{},
	
	toRGB: function(hex,alpha) {
		var lookup = this.rgbLookup[hex];
		if(lookup) return lookup;
		
		var hex = (hex.charAt(0) === '#') ? hex.substr(1) : hex,
			c = [], result;
			
		c[0] = parseInt(hex.substr(0, 2), 16);
		c[1] = parseInt(hex.substr(2, 2), 16);
		c[2] = parseInt(hex.substr(4, 2), 16);
			
		result = alpha === undefined ? 'rgb('+c.join(',')+')' : 'rgba('+c.join(',')+','+alpha+')';
		lookup = result;
		
		return result;
	}
});

Crafty.register = [];
Crafty.draw = function() {	
	//loop over entities to draw
	var i = 0, r = Crafty.register, l = r.length, e, o,
		ctx = Crafty.canvas.context, canv = Crafty.canvas.elem;
	
	//clear the canvas on each game loop
	if(ctx) {
		ctx.clearRect(0, 0, canv.width, canv.height);
		//TODO: sort canvas entities not DOM
		r.sort(function(a,b) { return a._global - b._global; });
	}
	
	for(;i < l; ++i) {
		e = r[i];
		o = e._changed;
		
		//check for rotation changes
		if(o.rotation != e.rotation) {
			e.rotated();
		}
		
		//check for position changes
		if(o.x !== e.x || o.y !== e.x || o.w !== e.x || o.h !== e.h) {
			e.moved();
		}
		
		e.draw();
	}
};