/**
 */
var svgns = "http://www.w3.org/2000/svg";
Crafty.c("Vector", {
	_svgDoc: null,
	_shapes: null,
	
	init: function () {
		this.requires('DOM, 2D');
		this._svgDoc = this._element.ownerDocument;
		this.DOM(this._svgDoc.createElement('svg'));
		this._element.setAttribute('xmlns', svgns);
	},
	
	createShape: function (shape, props) {
		var new_shape = this._svgDoc.createElementNS(svgns, shape);
		for (var i in props) {
			new_shape.setAttributeNS(null, i, props[i]);
		}
		this._element.appendChild(new_shape);
	},
});