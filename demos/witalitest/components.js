
Crafty.c("Player",{
	gender:null,
	name:'',
	equipment:{
		head:null,
		armor:null,
		left:null,
		right:null
	},
	mapName:'',
	direction:'s',
	position:{
		x:0,
		y:0
	},
	ground:null,
	movementSpeed:{
		x:40,
		y:20
	},
	url:null,
	xsrf:null,
	init:function(){ 
        
      
		this.requires("Render, Spatial, Texture, Multiway")
        .attr({
        	w:128,
        	h: 128,
        })
		.texture("img/male_player.png", { x: 0, y: 0, frames: 1 })
        .bind("NewDirection",function(direction){
      
        	if (direction.x == 0 && direction.y < 0 ) {
        		this.direction = 'n';
        	}
        	if (direction.x > 0 && direction.y < 0 ) {
        		this.direction = 'ne';
        	}
        	if (direction.x > 0 && direction.y == 0) {
        		this.direction = 'e';
        	}
        	if (direction.x > 0 && direction.y > 0) {
        		this.direction = 'se';
        	}
        	if (direction.x == 0 && direction.y > 0) {
        		this.direction = 's';
        	}
        	if (direction.x < 0 && direction.y > 0) {
        		this.direction = 'sw';
        	}
        	if (direction.x < 0 && direction.y == 0) {
        		this.direction = 'w';
        	}
        	if (direction.x < 0 && direction.y < 0) {
        		this.direction = 'nw';
        	}
            
    
        })
        .bind("KeyDown",function(e){
          
        	return true;
        	if(e.keyCode === Crafty.keys.U)
        		eq.trigger("Die");
            
        	if(e.keyCode === Crafty.keys.I)
        		eq.trigger("Hurt");
            
        	if(e.keyCode === Crafty.keys.O)
        		eq.trigger("Block");
            
        	if(e.keyCode === Crafty.keys.J)
        		eq.trigger("Skill");
        	if(e.keyCode === Crafty.keys.K)
        		eq.trigger("Shoot");
        	if(e.keyCode === Crafty.keys.SPACE)
        		eq.trigger("Attack");
        })
        .bind('Moved', function(from) {   
        	var vp = {
        		x:-this.x-this.w/2+Crafty.viewport.width/2,
        		y:-this.y-this.h+Crafty.viewport.height/2
        	}
        	Crafty.viewport.x = vp.x;
        	Crafty.viewport.y = vp.y;
        })
        .multiway(this.movementSpeed,{
        	W: -90, 
        	S: 90, 
        	D: 0, 
        	A: 180,
        	UP_ARROW:-90,
        	DOWN_ARROW:90,
        	RIGHT_ARROW:0,
        	LEFT_ARROW:180
        })
		//.bind("EnterFrame", function() {
		//	if (!this.fakeMove) {
		//		this.fakeMove = 0;
		//	}
		//	if(!this.fakeDirection) {
		//		this.fakeDirection = -1;
		//	}
		//	if (this.fakeMove < -100) {
		//		this.fakeDirection = 1;
		//	}
		//	if (this.fakeMove > 100) {
		//		this.fakeDirection = -1;
		//	}
		//	this.attr("x", this.x + this.fakeDirection);
		//	this.fakeMove += this.fakeDirection;
		//	this.trigger("Moved", {x: this.x, y:this.y});
		//	console.log(this.fakeMove);
		//})
		

        return this;
    }
  
});


