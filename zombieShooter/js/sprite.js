class Sprite{
	constructor(gl, img_url,material, opts={},isMultipe){
		this.gl = gl;
		this.isLoaded = false;
        this.material = material;
        
		this.size = new Point(64,64);

		if("width" in opts){
			this.size.x = opts.width * 1;
		}
		if("height" in opts){
			this.size.y = opts.height * 1;
		}
		
		this.image = new Image();
		this.image.src = img_url;
		if(!isMultipe)
		{
			this.image.width=this.size.x;
		    this.image.height=this.size.y;
		}
		this.image.sprite = this;
		this.image.onload = function(){
			this.sprite.setup();
		}
	}
	static createRectArray(x=0, y=0, w=1, h=1){
		return new Float32Array([
			x, y,
			x+w, y,
			x, y+h,
			x, y+h,
			x+w, y,
			x+w, y+h
		]);
	}
	setup(){
        let gl = this.gl;
        
		this.gl_tex = gl.createTexture();
		
		gl.bindTexture(gl.TEXTURE_2D, this.gl_tex);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
		gl.bindTexture(gl.TEXTURE_2D, null);
		
		this.uv_x = this.size.x / this.image.width;
		this.uv_y = this.size.y / this.image.height;
		
		this.tex_buff = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.tex_buff);
		gl.bufferData(gl.ARRAY_BUFFER, Sprite.createRectArray(0,0,this.uv_x,this.uv_y), gl.STATIC_DRAW);
		
		
		this.geo_buff = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.geo_buff);
		//gl.bufferData(gl.ARRAY_BUFFER, Sprite.createRectArray(0,0,this.size.x, this.size.y), gl.STATIC_DRAW);
		
		this.aPositionLoc = gl.getAttribLocation(this.material.program, "a_position");
		this.aTexcoordLoc = gl.getAttribLocation(this.material.program, "a_texCoord");
		this.uImageLoc = gl.getUniformLocation(this.material.program, "u_image");
        this.uFrameLoc = gl.getUniformLocation(this.material.program, "u_frame");
        
		this.isLoaded = true;
	}
	render(position, frames,angle=0){
		if(this.isLoaded){
			let gl = this.gl;
			
			let frame_x = Math.floor(frames.x) * this.uv_x;
			let frame_y = Math.floor(frames.y) * this.uv_y;
			
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, this.gl_tex);
			gl.uniform1i(this.uImageLoc, 0);
			
			gl.bindBuffer(gl.ARRAY_BUFFER, this.tex_buff);
			gl.enableVertexAttribArray(this.aTexcoordLoc);
			gl.vertexAttribPointer(this.aTexcoordLoc,2,gl.FLOAT,false,0,0);
			
			gl.bindBuffer(gl.ARRAY_BUFFER, this.geo_buff);
			gl.bufferData(gl.ARRAY_BUFFER, Sprite.createRectArrayWithAngle(position.x,position.y,this.size.x, this.size.y,angle), gl.STATIC_DRAW);
			gl.enableVertexAttribArray(this.aPositionLoc);
			gl.vertexAttribPointer(this.aPositionLoc,2,gl.FLOAT,false,0,0);
			
			gl.uniform2f(this.uFrameLoc, frame_x, frame_y);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            
		}
	}
	static rotatePoint(pos,angle)
	{
		let newPos = new Point(0,0);
		newPos.x = pos.x * Math.cos(angle) - pos.y * Math.sin(angle);
		newPos.y = pos.x * Math.sin(angle) + pos.y * Math.cos(angle);
		return newPos;
	}
	static createRectArrayWithAngle(x=0, y=0, w=1, h=1,angle)
	{
		let halfDims = new Point(w / 2.0, h / 2.0);

		let tl= new Point(-halfDims.x,halfDims.y);
		let bl= new Point(-halfDims.x, -halfDims.y);
		let tr = new Point(halfDims.x, halfDims.y);
		let br= new Point(halfDims.x,-halfDims.y);

		tl = Sprite.rotatePoint(tl, angle);
		tl.x += halfDims.x;
		tl.y += halfDims.y; 
		bl = Sprite.rotatePoint(bl, angle);
		bl.x += halfDims.x;
		bl.y += halfDims.y; 
		tr = Sprite.rotatePoint(tr, angle);
		tr.x += halfDims.x;
		tr.y += halfDims.y; 
		br = Sprite.rotatePoint(br, angle);
		br.x += halfDims.x;
		br.y += halfDims.y; 
		
		return new Float32Array([
			x+bl.x, y+bl.y,
			x+br.x, y+br.y,
			x+tl.x, y+tl.y,
			x+tl.x, y+tl.y,
			x+br.x, y+br.y,
			x+tr.x, y+tr.y
		]);



	}
}