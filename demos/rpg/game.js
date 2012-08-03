window.onload = function() {
	//start crafty
	Crafty.init(400, 320);


    Crafty.bind("Tick", function(time) {
        //console.log(time);
    });

    Crafty.e("Render, Spatial, Color").attr({ x: 30, y: 30, l: 30, w: 30 }).color("red").bind("Tick", function (delta) {
        //console.log(this.x);
        this.attr("x", this.x + 0.1 * delta);
    });

    return;

};