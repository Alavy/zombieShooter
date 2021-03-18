function Camera2D(gl,positionX,positionY){
    this.positionX=positionX;
    this.positionY=positionY;
    this.gl = gl;

    this._orthoMatrix = ortho(0.0,this.gl.canvas.width,0.0,this.gl.canvas.height);
    this.needUpdate = true;
    this.setPosition=function(x,y){
        this.positionX=x;
        this.positionY=y;
        this.needUpdate=true;
    }
    this.cameraUpdate = function(){
        if (this.needUpdate)
		{
            this._orthoMatrix = ortho(0.0,this.gl.canvas.width,0.0,this.gl.canvas.height);
            this._cameraMatrix= m4.translate(this._orthoMatrix,-this.positionX+this.gl.canvas.width/2, 
            -this.positionY + this.gl.canvas.height/2, 0.0);
            //this._cameraMatrix=m4.scale(this._cameraMatrix,.2,.2,0);
		    this.needUpdate = false;
        }
    }
    this.getCameraMatrix=function(){
        return this._cameraMatrix;
    }
    this.isBoxInView=function(position,dimension)
	{
		let MIN_DISTANCE_X = dimension.x/ 2.0 + (this.gl.canvas.width)/2; ///< minimum distance from center of agent to Tile
		let MIN_DISTANCE_Y = 0.0;

		let centerPos = new Point(position.x + dimension.x/2.0,position.y + dimension.y/2.0);  ///< Agent  position 
        let centerCameraPos = new Point(this.positionX,this.positionY);
        
		let distVec = new Point(centerPos.x - centerCameraPos.x,centerPos.y - centerCameraPos.y);///<Distance vector 

		let xDepth = MIN_DISTANCE_X - Math.abs(distVec.x);
		let yDepth = MIN_DISTANCE_Y - Math.abs(distVec.y);


		if (xDepth > 0 || yDepth > 0)
		{
            return true;
		}
		return false;
    };
    this.convertScreenToWorld = function(screenCoords)
	{
		screenCoords.y = this.gl.canvas.height - screenCoords.y;
		//Make it so that 0 is the center
        screenCoords.x -= (this.gl.canvas.width / 2);
        screenCoords.y -= (this.gl.canvas.height / 2);

        screenCoords.x += this.positionX;
        screenCoords.y += this.positionY;
        
		return screenCoords;
	}
}
function ortho(left, right, bottom, top) {
    var ret = new Float32Array(16).fill(0);
    ret[0]  = 2 / (right - left);
    ret[5]  = 2 / (top - bottom);
    ret[10] = -1;
    ret[12] = - (right + left) / (right - left);
    ret[13] = - (top + bottom) / (top - bottom);
    ret[15] = 1;
    return ret;
}