/**@
* #RectIsometric
* @category 2D
* Place entities in a 45deg rectangle isometric grid.
*/
Crafty.c("RectIsometric", {
	_tile: 0,
	_z: 0,
	
	/**@
	* #.RectIsometric
	* @comp RectIsometric
	* @sign public this .RectIsometric(Number tile)
	* @param tile -  Size of the isometric tiles
	* Place entities in a 45deg isometric fashion.
	*/
	RectIsometric: function(tile, z) {
		this._tile = tile;
		
		return this;
	},
		
	/**@
	* #.size
	* @comp RectIsometric
	* @sign public this .size(Number tileSize)
	* @param tileSize - The size of the tiles to place.
	* Method used to initialize the size of the isometric placement.
	* Recommended to use a size alues in the power of `2` (128, 64 or 32). 
	* This makes it easy to calculate positions and implement zooming.
	* @see .place
	*/
	size: function(tile) {
		this._tile = tile;
		return this;
	},
		
	/**@
	* #.place
	* @comp RectIsometric
	* @sign public this .place(Number x, Number y, Number z)
	* @param x - The `x` position to place the tile
	* @param y - The `y` position to place the tile
	* @param z - The `z` position or height to place the tile
	* Use this method to place itself in an isometric grid.
	* @see .size
	*/
	place: function(x, y, z) {
		var m = x * this._tile + (y & 1) * (this._tile / 2),
			n = y * this._tile / 4,
			n = n - z * (this._tile / 2);
			
		this.attr({x: m  + Crafty.viewport.x, y: n  + Crafty.viewport.y}).z += z;
		return this;
	}
});