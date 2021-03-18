class Game{

	constructor()
	{
		this.canvasElm = document.getElementById("canvas_element");
		this.canvasElm.width = 1000;
		this.canvasElm.height = 600;
		
		this.gl = this.canvasElm.getContext("webgl2");
		this.gl.clearColor(0.4,0.6,1.0,0.0);
		
		document.body.appendChild(this.canvasElm);

		this.vs = `attribute vec2 a_position;
		attribute vec2 a_texCoord;
		
		uniform vec2 u_frame;
		varying vec2 v_texCoord;

		uniform mat4 u_projection;

		void main() {
			
			gl_Position = u_projection * vec4(a_position, 0, 1);
			v_texCoord = a_texCoord + u_frame;
		}`;
		this.fs = `precision mediump float;
		uniform sampler2D u_image;
		varying vec2 v_texCoord;
		
		void main(){
			gl_FragColor = texture2D(u_image, v_texCoord);
		}`;

		this.material = new Material(this.gl,this.vs,this.fs);

		this.level_manager=new LevelManager(this.gl,this.material);
		this.level_manager.initLevel();

        this.player = new Player(this.level_manager._startPlayerpos.x, this.level_manager._startPlayerpos.y);
		this.camera = new Camera2D(this.gl,this.player.x,this.player.y);

		this.AGENT_WIDTH = 40;
		this.ZOMBIE_VELOCITY = 3;
		this.HUMAN_VELOCITY = 2.8;
		this.LIFEREDUCE=30;

		this.bullets=[];

		
		this.humans = [];
		for(let index=0; index < this.level_manager._humanStartPos.length;index++)
		{
			let element = this.level_manager._humanStartPos[index];
			this.humans.push(new Human(element.x,element.y));
		}
		this.zombies=[];
		for(let index=0;index<this.level_manager._zombiStartPos.length;index++)
		{
			let element = this.level_manager._zombiStartPos[index];
			this.zombies.push(new Zombie(element.x,element.y));
		}
		this.BULLET_WIDTH=5;
		this.player_sprite = new Sprite(this.gl, "img/player.png", this.material, {width:this.AGENT_WIDTH, height:this.AGENT_WIDTH},false);
		this.player_frame = new Point(0,0);
		this.human_sprite = new Sprite(this.gl, "img/human.png", this.material, {width:this.AGENT_WIDTH, height:this.AGENT_WIDTH},true);
		this.human_frame = new Point(0,0);
		this.zombie_sprite = new Sprite(this.gl, "img/zombie.png", this.material, {width:this.AGENT_WIDTH, height:this.AGENT_WIDTH},true);
		this.zombie_frame = new Point(0,0);
		this.bullet_sprite = new Sprite(this.gl, "img/circle.png", this.material, {width:this.BULLET_WIDTH, height:this.BULLET_WIDTH},false);
		this.bullet_frame = new Point(0,0);
	}
	resize(w,h){
		this.gl.canvas.width = w;
		this.gl.canvas.height = h;
		this.camera.setPosition(this.player.x,this.player.y);
	}
	getMouseVec(){
		let screenCoords = new Point(this.MouseX,this.MouseY);
		screenCoords.y = this.gl.canvas.height - screenCoords.y;
		screenCoords.x -= (this.gl.canvas.width / 2);
        screenCoords.y -= (this.gl.canvas.height / 2);
		return screenCoords;
	}
	
	keyPush(evt) {
		switch (evt.keyCode) {
		case 37:
			this.player.x -= this.player.velocity;
			break;
		case 38:
			this.player.y += this.player.velocity;
			break;
		case 39:
			this.player.x += this.player.velocity;
			break;
		case 40:
			this.player.y -= this.player.velocity;
			break;
		}
		this.camera.setPosition(this.player.x,this.player.y);
	}
	mousemove(evt)
	{
		this.MouseX=evt.screenX;
		this.MouseY=evt.screenY;
	}
	mousedown(evt){

		let centerPos = new Point(this.player.x+this.AGENT_WIDTH/2,this.player.y+this.AGENT_WIDTH/2);
		let bulletPos = new Point(this.AGENT_WIDTH/4,(this.AGENT_WIDTH/3));
		bulletPos = Sprite.rotatePoint(bulletPos,this.player.angle);
	
		bulletPos.x = centerPos.x + bulletPos.x;
		bulletPos.y = centerPos.y + bulletPos.y;
	
		this.bullets.push(new Bullet(bulletPos.x,bulletPos.y,this.player.angle,25));
	}
	update(){
		this.gl.viewport(0,0, this.canvasElm.width, this.canvasElm.height);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
		
		this.gl.enable(this.gl.BLEND);
		this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
		this.gl.useProgram(this.material.program);

		this.playerUpdate();
		
       

        this.camera.cameraUpdate();
		this.humanUpdate();

		this.zombieUpdate();
		this.bulletUpdate();

        this.agentCollision();


		this.uProjectionLoc = this.gl.getUniformLocation(this.material.program, "u_projection");
        this.gl.uniformMatrix4fv(this.uProjectionLoc, false, this.camera.getCameraMatrix());

        for (let index = 0; index < this.level_manager.TilePos.length; index++) {
            let element = this.level_manager.TilePos[index];
            if (this.camera.isBoxInView(new Point(element.x, element.y), new Point(this.level_manager.TILE_WIDTH, this.level_manager.TILE_WIDTH))) {
                this.level_manager.renderTile(element);
            }
        }

		this.player_sprite.render(new Point(this.player.x,this.player.y), this.player_frame,this.player.angle);

		this.zombies.forEach(element=>{
			if(this.camera.isBoxInView(new Point(element.x,element.y),new Point(this.AGENT_WIDTH,this.AGENT_WIDTH)))
			{
				this.zombie_sprite.render(new Point(element.x,element.y),this.zombie_frame,element.angle);
			}
		});

		this.humans.forEach(element=>{
			if(this.camera.isBoxInView(new Point(element.x,element.y),new Point(this.AGENT_WIDTH,this.AGENT_WIDTH)))
			{
				this.human_sprite.render(new Point(element.x,element.y),this.human_frame,element.angle);
			}
		});
		this.bullets.forEach(element=>{
			if(this.camera.isBoxInView(new Point(element.x,element.y),new Point(this.BULLET_WIDTH,this.BULLET_WIDTH)))
			{
				this.bullet_sprite.render(new Point(element.x,element.y),this.bullet_frame,element.angle);
			}
        });

		this.gl.useProgram(null);
		this.gl.flush();
	}
	bulletUpdate(){
		let index=0;
		this.bullets.forEach(bullet=>{
			let dir = this.angleToDir(bullet.angle);
			bullet.x += dir.x * bullet.speed;
			bullet.y +=  dir.y * bullet.speed;
			if(this.level_manager.collideWithWorld(bullet))
			{
				this.bullets.splice(index,1);
			}
			let human_index=0;
			this.humans.forEach(human=>{
				if(this.BulletcollideWithAgent(bullet,human))
				{
					this.bullets.splice(index,1);
					human.life -= this.LIFEREDUCE;
					if(human.life<0)
					{
						this.humans.splice(human_index,1);
					}
				}
				human_index++;

			});
			let zombie_index=0;
			this.zombies.forEach(zombie=>{
				if(this.BulletcollideWithAgent(bullet,zombie))
				{
					this.bullets.splice(index,1);
					zombie.life -= this.LIFEREDUCE;
					if(zombie.life<0)
					{
						this.zombies.splice(zombie_index,1);
					}
				}
				zombie_index++;
			});
			index++;
		});
	}
	playerUpdate(){
		let MouseVec = this.getMouseVec();
		MouseVec = new Point(MouseVec.x,MouseVec.y);
		MouseVec = Point.vecNormalize(MouseVec);
        this.player.angle = Point.convertDirToAngle(MouseVec);

        this.level_manager.collideWithLevel(this.player, this.AGENT_WIDTH);

	}
	humanUpdate(){
		this.human_frame.x = (new Date() * 0.006) % 3;
        this.human_frame.y = (new Date() * 0.002) % 2;
        
        this.humans.forEach(element => {

			let dir = this.angleToDir(element.angle);
			element.x += dir.x * this.HUMAN_VELOCITY;
			element.y +=  dir.y * this.HUMAN_VELOCITY;

            if (this.level_manager.collideWithLevel(element, this.AGENT_WIDTH)) {
				element.angle = this.negativeRandomNumber(Math.PI);
           }
		});

	}
	negativeRandomNumber(num)
	{
		num = Math.random() * num;
		
		let index = Math.random()>.5?1:-1;
		//console.log(num*index);
		return num*index;
	}
	playerFind(element){
		let distVec = new Point(this.player.x - element.x , this.player.y - element.y);
		let distance = Point.length(distVec);
				//console.log(distance);
		if(distance < 5000)
		{
			if(this.player.angle>0)
			{
				element.angle = (this.player.angle - Math.PI);
			}
			else{
				element.angle = (Math.PI-Math.abs(this.player.angle));
			}
		}
	}
	
	zombieUpdate(){
		this.zombie_frame.x = (new Date() * 0.006) % 4;
		this.zombie_frame.y = (new Date() * 0.002) % 2;

        
        this.zombies.forEach(element => {

			let dir = this.angleToDir(element.angle);
			element.x += dir.x * this.ZOMBIE_VELOCITY;
			element.y +=  dir.y * this.ZOMBIE_VELOCITY;

			

			this.humans.forEach(human => {
				let distVec = new Point(human.x - element.x , human.y - element.y);
				let distance = Point.length(distVec);
				//console.log(distance);
				if(distance < 5000)
				{
					if(human.angle>0)
					{
						element.angle = (human.angle - Math.PI);
					}
					else{
						element.angle = (Math.PI-Math.abs(human.angle));
					}
				}
			});
			this.playerFind(element);
            if (this.level_manager.collideWithLevel(element, this.AGENT_WIDTH)) {
				
           }
		});
        

	}
	angleToDir(angle)
	{
		let dir = new Point(0,0);
		if(angle >=0 && angle<(Math.PI/2))
		{
			dir.x = 1;
			dir.y = Math.tan(angle);
		}
		else if(angle==(Math.PI/2))
		{
			dir.x = 0;
			dir.y = 1;
		}
		else if(angle==(-(Math.PI)/2))
		{
			dir.x = 0;
			dir.y =-1;
		}
		else if(angle>(Math.PI/2) && angle <=Math.PI)
		{
			dir.x = -1;
			dir.y =  -1*Math.tan(angle);
		}
		else if(angle >= - Math.PI && angle <(-Math.PI/2))
		{
			dir.x = -1;
			dir.y =  -1*Math.tan(angle);
		}
		else if(angle>(-Math.PI/2) && angle <0 )
		{
			dir.x = 1;
			dir.y =  Math.tan(angle);
		}
		return Point.vecNormalize(dir);
	}
    agentCollision() {
        for (let i = 0; i < this.zombies.length; i++) {

            this.zombies.forEach(element=>{
				if(this.zombies[i]==element)
				{
					return;
				}
				if(this.collideWithAgent(this.zombies[i],element, this.AGENT_WIDTH))
				{
					this.zombies[i].angle=element.angle;
				}
			});
            //human collision
            for (let j = 0; j < (this.humans.length); j++) {
                if (this.collideWithAgent(this.zombies[i], this.humans[j], this.AGENT_WIDTH)) {
					let deleteH = this.humans[j];
					this.humans.splice(j,1);
					let newZombie = new Zombie(deleteH.x,deleteH.y);
					newZombie.angle=this.zombies[i].angle;
					this.zombies.push(newZombie);
                }
			}
			//player collision zombie
			if(this.collideWithAgent(this.player, this.zombies[i], this.AGENT_WIDTH))
			{
			}
        }
        for (let i = 0; i < this.humans.length; i++) {

            for (let j = 0; j < (this.humans.length && j !== i); j++) {
				this.collideWithAgent(this.humans[i], this.humans[j], this.AGENT_WIDTH);

			}
			//player collision with human
			this.collideWithAgent(this.player, this.humans[i], this.AGENT_WIDTH);
        }

	}
	radToDegree(angle){
		return (180/Math.PI)*angle;
	}
	degreeToRad(angle){
		return (Math.PI/180)*angle;
	}
    collideWithAgent(agentA, agentB, AGENT_WIDTH) {
        let MIN_DISTANCE = AGENT_WIDTH;
        let _positionA = new Point(agentA.x, agentA.y);
        let _positionB = new Point(agentB.x, agentB.y);

        let centerPosA = new Point(_positionA.x + AGENT_WIDTH / 2, _positionA.y + AGENT_WIDTH / 2);
        let centerPosB = new Point(_positionB.x + AGENT_WIDTH / 2, _positionB.y + AGENT_WIDTH / 2);

        let distVec = new Point(centerPosA.x - centerPosB.x, centerPosA.y - centerPosB.y);
        let distance = Math.sqrt(distVec.x * distVec.x + distVec.y * distVec.y);
        let collisionDepth = MIN_DISTANCE - distance;

        if (collisionDepth > 0) {
            let collosionDepthVec = Point.vecNormalize(distVec);
			collosionDepthVec.x = collosionDepthVec.x * collisionDepth;
			collosionDepthVec.y = collosionDepthVec.y * collisionDepth;
			
            agentA.x += collosionDepthVec.x / 2.0;
            agentA.y += collosionDepthVec.y / 2.0;

            agentB.x -= collosionDepthVec.x / 2.0;
            agentB.y -= collosionDepthVec.y / 2.0;
            return true;
        }
        return false;
	}
	BulletcollideWithAgent(bullet,agent)
	{
		let BULLET_RADIUS = this.BULLET_WIDTH/2;
		let MIN_DISTANCE = BULLET_RADIUS+(this.AGENT_WIDTH/2);
		let centerPosA = new Point(bullet.x+BULLET_RADIUS,bullet.y+BULLET_RADIUS);
		let centerPosB = new Point(agent.x+this.AGENT_WIDTH/2,agent.y+this.AGENT_WIDTH/2);

		let distVec = new Point(centerPosA.x - centerPosB.x,centerPosA.y - centerPosB.y);
		let distance = Math.sqrt(distVec.x * distVec.x + distVec.y * distVec.y);
		let collisionDepth = MIN_DISTANCE - distance;

		if (collisionDepth > 0)
		{
			return true;
		}
		return false;
	}
}