Crafty.map = new Crafty.HashMap();
var M = Math,
	Mc = M.cos,
	Ms = M.sin,
	PI = M.PI,
	DEG_TO_RAD = PI / 180;


/**@
* #2D
* @comp 2D
* Component for any entity that has a position on the stage.
*/
Crafty.c("2D", {
	/**@
	* #.x
	* The `x` position on the stage. When modified, will automatically be redrawn.
	* Is actually a getter/setter so when using this value for calculations and not modifying it,
	* use the `._x` property.
	*/
	x: 0,
	/**@
	* #.y
	* The `y` position on the stage. When modified, will automatically be redrawn.
	* Is actually a getter/setter so when using this value for calculations and not modifying it,
	* use the `._y` property.
	*/
	y: 0,
	/**@
	* #.w
	* The width of the entity. When modified, will automatically be redrawn.
	* Is actually a getter/setter so when using this value for calculations and not modifying it,
	* use the `._w` property.
	*
	* Changing this value is not recommended as canvas has terrible resize quality and DOM will just clip the image.
	*/
	w: 0,
	/**@
	* #.x
	* The height of the entity. When modified, will automatically be redrawn.
	* Is actually a getter/setter so when using this value for calculations and not modifying it,
	* use the `._h` property.
	*
	* Changing this value is not recommended as canvas has terrible resize quality and DOM will just clip the image.
	*/
	h: 0,
	/**@
	* #.z
	* The `z` index on the stage. When modified, will automatically be redrawn.
	* Is actually a getter/setter so when using this value for calculations and not modifying it,
	* use the `._z` property.
	*
	* A higher `z` value will be closer to the front of the stage. A smaller `z` value will be closer to the back.
	* A global Z index is produced based on its `z` value as well as the GID (which entity was created first).
	* Therefore entities will naturally maintain order depending on when it was created if same z value.
	*/
	z: 0,
	/**@
	* #.rotation
	* Set the rotation of your entity. Rotation takes degrees in a clockwise direction.
	* It is important to note there is no limit on the rotation value. Setting a rotation 
	* mod 360 will give the same rotation without reaching huge numbers.
	*/
	rotation: 0,
	/**@
	* #.alpha
	* Transparency of an entity. Must be a decimal value between 0.0 being fully transparent to 1.0 being fully opaque.
	*/
	alpha: 1.0,
	/**@
	* #.visible
	* If the entity is visible or not. Accepts a true or false value.
	* Can be used for optimization by setting an entities visibility to false when not needed to be drawn.
	*
	* The entity will still exist and can be collided with but just won't be drawn.
	*/
	visible: true,
	//TODO: COMMENT!
	flipX: false,
	
	flipY: false,
	
	_global: null,
	
	_origin: null,
	_mbr: null,
	_entry: null,
	_children: null,
	_changed: null,
	
	init: function() {
		this._global = this[0];
		this._origin = {x: 0, y: 0};
		this._children = [];
		
		//store the old position
		this._changed = {
			x: 0,
			y: 0,
			w: 0,
			h: 0,
			z: 0,
			rotation: 0,
			alpha: 1.0,
			flipX: false,
			flipY: false
		};
		
		//insert self into the HashMap
		this._entry = Crafty.map.insert(this);
		
		//when object is removed, remove from HashMap
		this.bind("Remove", function() {
			Crafty.map.remove(this);
			
			this.detach();
		});
		
	},
	
	reset: function() {
		var old = this._changed;
		
		old.x = this.x;
		old.y = this.y;
		old.w = this.w;
		old.h = this.h;
		old.z = this.z;
		old.rotation = this.rotation;
		old.alpha = this.alpha;
		old.flipX = this.flipX;
		old.flipY = this.flipY;
	},
	
	moved: function() {
		var pos = this._mbr || this;
		this._entry.update(pos);
		this._cascade();
		this.trigger("Change");
	},
	
	/**
	* Move or rotate all the children for this entity
	*/
	_cascade: function(rotated) {
		var i = 0, 
			children = this._children, 
			l = children.length, obj,
			old = this._changed;
			
		//use MBR or current
		var dx = this.x - old.x,
			dy = this.y - old.y;

		for(;i<l;++i) {
			obj = children[i];
			obj.shift(dx,dy);
		}
	},
	
	/**
	* #.attach
	* @comp 2D
	* @sign public this .attach(Entity obj[, .., Entity objN])
	* @param obj - Entity(s) to attach
	* Attaches an entities position and rotation to current entity. When the current entity moves, 
	* the attached entity will move by the same amount.
	*
	* As many objects as wanted can be attached and a hierarchy of objects is possible by attaching.
	*/
	attach: function() {
		var i = 0, arg = arguments, l = arguments.length, obj;
		for(;i<l;++i) {
			obj = arg[i];
			this._children.push(obj);
		}

		return this;
	},

	/**@
	* #.detach
	* @comp 2D
	* @sign public this .detach([Entity obj])
	* @param obj - The entity to detach. Left blank will remove all attached entities
	* Stop an entity from following the current entity. Passing no arguments will stop
	* every entity attached.
	*/
	detach: function(obj) {
		//if nothing passed, remove all attached objects
		if(!obj) {
			this._children = [];
			return this;
		}
		
		//if obj passed, find the handler and unbind
		for (var i = 0; i < this._children.length; i++) {
			if (this._children[i] == obj) {
				this._children.splice(i, 1);
			}
		}

		return this;
	},
	
	/**
	* Calculates the MBR when rotated with an origin point
	*/
	rotated: function() {
		var theta = -1 * (this.rotation % 360), //angle always between 0 and 359
			rad = theta * DEG_TO_RAD,
			ct = Math.cos(rad), //cache the sin and cosine of theta
			st = Math.sin(rad),
			o = {x: this._origin.x + this.x, 
				 y: this._origin.y + this.y}; 
		
		//if the angle is 0 and is currently 0, skip
		if(!theta) {
			this._mbr = null;
			if(!this.rotation % 360) return;
		}
		
		//rotate each corner to find the min and max
		var x0 = o.x + (this.x - o.x) * ct + (this.y - o.y) * st,
			y0 = o.y - (this.x - o.x) * st + (this.y - o.y) * ct,
			x1 = o.x + (this.x + this.w - o.x) * ct + (this.y - o.y) * st,
			y1 = o.y - (this.x + this.w - o.x) * st + (this.y - o.y) * ct,
			x2 = o.x + (this.x + this.w - o.x) * ct + (this.y + this.h - o.y) * st,
			y2 = o.y - (this.x + this.w - o.x) * st + (this.y + this.h - o.y) * ct,
			x3 = o.x + (this.x - o.x) * ct + (this.y + this.h - o.y) * st,
			y3 = o.y - (this.x - o.x) * st + (this.y + this.h - o.y) * ct,
			
			minX = Math.floor(Math.min(x0, x1, x2, x3)),
			minY = Math.floor(Math.min(y0, y1, y2, y3)),
			maxX = Math.ceil(Math.max(x0, x1, x2, x3)),
			maxY = Math.ceil(Math.max(y0, y1, y2, y3));
			
		this._mbr = {x: minX, y: minY, w: maxX - minX, h: maxY - minY};
		
		this._matrix = {M11: ct, M12: st, M21: -st, M22: ct};
		this._entry.update(this._mbr);
		
		this.trigger("Change");
	},
	
	/**@
	* #.area
	* @comp 2D
	* @sign public Number .area(void)
	* Calculates the area of the entity
	*/
	area: function() {
		return this.w * this.h;
	},
	
	/**@
	* #.intersect
	* @comp 2D
	* @sign public Boolean .intersect(Number x, Number y, Number w, Number h)
	* @param x - X position of the rect
	* @param y - Y position of the rect
	* @param w - Width of the rect
	* @param h - Height of the rect
	* @sign public Boolean .intersect(Object rect)
	* @param rect - An object that must have the `x, y, w, h` values as properties
	* Determines if this entity intersects a rectangle.
	*/
	intersect: function(x,y,w,h) {
		var rect, obj = this._mbr || this;
		if(typeof x === "object") {
			rect = x;
		} else {
			rect = {x: x, y: y, w: w, h: h};
		}
		
		return obj.x < rect.x + rect.w && obj.x + obj.w > rect.x &&
			   obj.y < rect.y + rect.h && obj.h + obj.y > rect.y;
	},
	
	/**@
	* #.within
	* @comp 2D
	* @sign public Boolean .within(Number x, Number y, Number w, Number h)
	* @param x - X position of the rect
	* @param y - Y position of the rect
	* @param w - Width of the rect
	* @param h - Height of the rect
	* @sign public Boolean .within(Object rect)
	* @param rect - An object that must have the `x, y, w, h` values as properties
	* Determines if this current entity is within another rectangle.
	*/
	within: function(x,y,w,h) {
		var rect;
		if(typeof x === "object") {
			rect = x;
		} else {
			rect = {x: x, y: y, w: w, h: h};
		}
		
		return rect.x <= this.x && rect.x + rect.w >= this.x + this.w &&
				rect.y <= this.y && rect.y + rect.h >= this.y + this.h;
	},
	
	/**@
	* #.contains
	* @comp 2D
	* @sign public Boolean .contains(Number x, Number y, Number w, Number h)
	* @param x - X position of the rect
	* @param y - Y position of the rect
	* @param w - Width of the rect
	* @param h - Height of the rect
	* @sign public Boolean .contains(Object rect)
	* @param rect - An object that must have the `x, y, w, h` values as properties
	* Determines if the rectangle is within the current entity.
	*/
	contains: function(x,y,w,h) {
		var rect;
		if(typeof x === "object") {
			rect = x;
		} else {
			rect = {x: x, y: y, w: w, h: h};
		}
		
		return rect.x >= this.x && rect.x + rect.w <= this.x + this.w &&
				rect.y >= this.y && rect.y + rect.h <= this.y + this.h;
	},
	
	/**@
	* #.pos
	* @comp 2D
	* @sign public Object .pos(void)
	* Returns the x, y, w, h properties as a rect object 
	* (a rect object is just an object with the keys _x, _y, _w, _h).
	*
	* The keys have an underscore prefix. This is due to the x, y, w, h 
	* properties being merely setters and getters that wrap the properties with an underscore (_x, _y, _w, _h).
	*/
	pos: function() {
		return {
			x: (this.x),
			y: (this.y),
			w: (this.w),
			h: (this.h)
		};
	},
	
	/**
	* Returns the minimum bounding rectangle. If there is no rotation
	* on the entity it will return the rect.
	*/
	mbr: function() {
		if(!this._mbr) return this.pos();
		return {
			x: (this._mbr.x),
			y: (this._mbr.y),
			w: (this._mbr.w),
			h: (this._mbr.h)
		};
	},
	
	/**@
	* #.isAt
	* @comp 2D
	* @sign public Boolean .isAt(Number x, Number y)
	* @param x - X position of the point
	* @param y - Y position of the point
	* Determines whether a point is contained by the entity. Unlike other methods, 
	* an object can't be passed. The arguments require the x and y value
	*/
	isAt: function(x,y) {
		return this.x <= x && this.x + this.w >= x &&
			   this.y <= y && this.y + this.h >= y;
	},
	
	/**@
	* #.move
	* @comp 2D
	* @sign public this .move(String dir, Number by)
	* @param dir - Direction to move (n,s,e,w,ne,nw,se,sw)
	* @param by - Amount to move in the specified direction
	* Quick method to move the entity in a direction (n, s, e, w, ne, nw, se, sw) by an amount of pixels.
	*/
	move: function(dir, by) {
		if(dir.charAt(0) === 'n') this.y -= by;
		if(dir.charAt(0) === 's') this.y += by;
		if(dir === 'e' || dir.charAt(1) === 'e') this.x += by;
		if(dir === 'w' || dir.charAt(1) === 'w') this.x -= by;
		
		return this;
	},
	
	/**@
	* #.shift
	* @comp 2D
	* @sign public this .shift(Number x, Number y, Number w, Number h)
	* @param x - Amount to move X 
	* @param y - Amount to move Y
	* @param w - Amount to widen
	* @param h - Amount to increase height
	* Shift or move the entity by an amount. Use negative values
	* for an opposite direction.
	*/
	shift: function(x,y,w,h) {
		if(x) this.x += x;
		if(y) this.y += y;
		if(w) this.w += w;
		if(h) this.h += h;
		
		return this;
	},
	
	/**@
	* #.origin
	* @comp 2D
	* @sign public this .origin(Number x, Number y)
	* @param x - Pixel value of origin offset on the X axis
	* @param y - Pixel value of origin offset on the Y axis
	* @sign public this .origin(String offset)
	* @param offset - Combination of center, top, bottom, middle, left and right
	* Set the origin point of an entity for it to rotate around. 
	* @example
	* ~~~
	* this.origin("top left")
	* this.origin("center")
	* this.origin("bottom right")
	* this.origin("middle right")
	* ~~~
	* @see .rotation
	*/
	origin: function(x,y) {
		//text based origin
		if(typeof x === "string") {
			if(x === "centre" || x === "center" || x.indexOf(' ') === -1) {
				x = this.w / 2;
				y = this.h / 2;
			} else {
				var cmd = x.split(' ');
				if(cmd[0] === "top") y = 0;
				else if(cmd[0] === "bottom") y = this.h;
				else if(cmd[0] === "middle" || cmd[1] === "center" || cmd[1] === "centre") y = this.h / 2;
				
				if(cmd[1] === "center" || cmd[1] === "centre" || cmd[1] === "middle") x = this.w / 2;
				else if(cmd[1] === "left") x = 0;
				else if(cmd[1] === "right") x = this.w;
			}
		}
		
		this._origin.x = x;
		this._origin.y = y;
		
		return this;
	}
});

Crafty.c("Physics", {
	_gravity: 0.4,
	_friction: 0.2,
	_bounce: 0.5,
	
	gravity: function(gravity) {
		this._gravity = gravity;
	}
});

Crafty.c("Gravity", {
	_gravity: 0.2,
	_gy: 0,
	_falling: true,
	_anti: null,

	init: function() {
		if(!this.has("2D")) this.addComponent("2D");		
	},

	gravity: function(comp) {
		if(comp) this._anti = comp;

		this.bind("EnterFrame", this._enterframe);

		return this;
	},

	_enterframe: function() {
		if(this._falling) {
			//if falling, move the players Y
			this._gy += this._gravity * 2;
			this.y += this._gy;
		} else {
			this._gy = 0; //reset change in y
		}

		var obj, hit = false, pos = this.pos(),
			q, i = 0, l;

		//Increase by 1 to make sure map.search() finds the floor
		pos.y++;

		//map.search wants _x and intersect wants x...
		pos.x = pos.x;
		pos.y = pos.y;
		pos.w = pos.w;
		pos.h = pos.h;

		q = Crafty.map.search(pos);
		l = q.length;

		for(;i<l;++i) {
			obj = q[i];
			//check for an intersection directly below the player
			if(obj !== this && obj.has(this._anti) && obj.intersect(pos)) {
				hit = obj;
				break;
			}
		}

		if(hit) { //stop falling if found
			if(this._falling) this.stopFalling(hit);
		} else {
			this._falling = true; //keep falling otherwise
		}
	},

	stopFalling: function(e) {
		if(e) this.y = e.y - this._h ; //move object

		//this._gy = -1 * this._bounce;
		this._falling = false;
		if(this._up) this._up = false;
		this.trigger("hit");
	},

	antigravity: function() {
		this.unbind("EnterFrame", this._enterframe);
	}
});

/**@
* #Crafty.Polygon
* @category 2D
* Polygon object used for hitboxes and click maps. Must pass an Array for each point as an 
* argument where index 0 is the x position and index 1 is the y position.
*
* For example one point of a polygon will look like this: `[0,5]` where the `x` is `0` and the `y` is `5`.
*
* Can pass an array of the points or simply put each point as an argument.
*
* When creating a polygon for an entity, each point should be offset or relative from the entities `x` and `y` 
* (don't include the absolute values as it will automatically calculate this).
*/
Crafty.polygon = function(poly) {
	if(arguments.length > 1) {
		poly = Array.prototype.slice.call(arguments, 0);
	}
	this.points = poly;
};

Crafty.polygon.prototype = {
	/**@
	* #.containsPoint
	* @comp Crafty.Polygon
	* @sign public Boolean .containsPoint(Number x, Number y)
	* @param x - X position of the point
	* @param y - Y position of the point
	* Method is used to determine if a given point is contained by the polygon.
	* @example
	* ~~~
	* var poly = new Crafty.polygon([50,0],[100,100],[0,100]);
	* poly.containsPoint(50, 50); //TRUE
	* poly.containsPoint(0, 0); //FALSE
	* ~~~
	*/
	containsPoint: function(x, y) {
		var p = this.points, i, j, c = false;

		for (i = 0, j = p.length - 1; i < p.length; j = i++) {
			if (((p[i][1] > y) != (p[j][1] > y)) && (x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0])) {
				c = !c;
			}
		}

		return c;
	},
	
	/**@
	* #.shift
	* @comp Crafty.Polygon
	* @sign public void .shift(Number x, Number y)
	* @param x - Amount to shift the `x` axis
	* @param y - Amount to shift the `y` axis
	* Shifts every single point in the polygon by the specified amount.
	* @example
	* ~~~
	* var poly = new Crafty.polygon([50,0],[100,100],[0,100]);
	* poly.shift(5,5);
	* //[[55,5], [105,5], [5,105]];
	* ~~~
	*/
	shift: function(x,y) {
		var i = 0, l = this.points.length, current;
		for(;i<l;i++) {
			current = this.points[i];
			current[0] += x;
			current[1] += y;
		}
	},
	
	rotate: function(e) {
		var i = 0, l = this.points.length, 
			current, x, y;
			
		for(;i<l;i++) {
			current = this.points[i];
			
			x = e.o.x + (current[0] - e.o.x) * e.cos + (current[1] - e.o.y) * e.sin;
			y = e.o.y - (current[0] - e.o.x) * e.sin + (current[1] - e.o.y) * e.cos;
			
			current[0] = Math.floor(x);
			current[1] = Math.floor(y);
		}
	}
};

Crafty.matrix = function(m) {
	this.mtx = m;
	this.width = m[0].length;
	this.height = m.length;
};

Crafty.matrix.prototype = {
	x: function(other) {
		if (this.width != other.height) {
			return;
		}
	 
		var result = [];
		for (var i = 0; i < this.height; i++) {
			result[i] = [];
			for (var j = 0; j < other.width; j++) {
				var sum = 0;
				for (var k = 0; k < this.width; k++) {
					sum += this.mtx[i][k] * other.mtx[k][j];
				}
				result[i][j] = sum;
			}
		}
		return new Crafty.matrix(result); 
	},
	
	
	e: function(row, col) {
		//test if out of bounds
		if(row < 1 || row > this.mtx.length || col < 1 || col > this.mtx[0].length) return null;
		return this.mtx[row - 1][col - 1];
	}
}