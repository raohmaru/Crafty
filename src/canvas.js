/**@
* #Canvas
* @category Graphics
* Draws itself onto a canvas. Crafty.canvas() must be called before hand to initialize
* the canvas element.
*/
Crafty.c("Canvas", {
	
	init: function() {
		if(!Crafty.canvas.context) {
			Crafty.canvas.init();
		}
		
		Crafty.register.push(this);
	},
	
	/**@
	* #.draw
	* @comp Canvas
	* @sign public this .draw()
	* @triggers Draw
	* Method to draw the entity on the canvas element. Can pass rect values for redrawing a segment of the entity.
	*/
	draw: function() {
		if(!this.ready) return;
		
		var ctx = Crafty.canvas.context,
			old = this._changed,
			globalAlpha;
			
		if(old.rotation !== this.rotation) {
			ctx.save();
			ctx.translate(this._origin.x + this.x, this._origin.y + this.y);
			ctx.rotate((this._rotation % 360) * (Math.PI / 180));
		}
		
		//draw with alpha
		if(old.alpha !== this.alpha) {
			globalAlpha = ctx.globalAlpha;
			ctx.globalAlpha = this.alpha;
		}
		
		this.trigger("Draw", {type: "canvas"});
		
		if(old.rotation !== this.rotation) {
			ctx.restore();
		}
		
		if(globalAlpha) {
			ctx.globalAlpha = globalAlpha;
		}
		
		this.reset();
		
		return this;
	}
});

/**@
* #Crafty.canvas
* @category Graphics
* Collection of methods to draw on canvas.
*/
Crafty.extend({
	canvas: {
		/**@
		* #Crafty.canvas.context
		* @comp Crafty.canvas
		* This will return the 2D context of the main canvas element. 
		* The value returned from `Crafty.canvas.elem.getContext('2d')`.
		*/
		context: null,
		/**@
		* #Crafty.canvas.elem
		* @comp Crafty.canvas
		* Main Canvas element
		*/
		elem: null,
		
		/**@
		* #Crafty.canvas.init
		* @comp Crafty.canvas
		* @sign public void Crafty.canvas.init(void)
		* @triggers NoCanvas
		* Creates a `canvas` element inside the stage element. Must be called
		* before any entities with the Canvas component can be drawn.
		*
		* This method will automatically be called if no `Crafty.canvas.context` is
		* found.
		*/
		init: function() {
			//check if canvas is supported
			if(!Crafty.support.canvas) {
				Crafty.trigger("NoCanvas");
				Crafty.stop();
				return;
			}
			
			//create 3 empty canvas elements
			var c;
			c = document.createElement("canvas");
			c.width = Crafty.viewport.width;
			c.height = Crafty.viewport.height;
			c.style.position = 'absolute';
			c.style.left = "0px";
			c.style.top = "0px";
			
			Crafty.stage.elem.appendChild(c);
			Crafty.canvas.context = c.getContext('2d');
			Crafty.canvas.elem = c;
		}
	}
});