class HeartPreloader {
    constructor(containerId) {
        // Create container if it doesn't exist
        let container = document.getElementById(containerId);
        if (!container) {
            container = document.createElement('div');
            container.id = containerId;
            container.style.position = 'fixed';
            container.style.top = '0';
            container.style.left = '0';
            container.style.width = '100%';
            container.style.height = '100%';
            container.style.zIndex = '9999';
            container.style.backgroundColor = 'black';
            document.body.appendChild(container);
        }

        this.container = container;
        this.canvas = document.createElement('canvas');
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.container.appendChild(this.canvas);

        this.isActive = true;
        this.init();
    }

    init() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        const gl = this.canvas.getContext('webgl');
        if (!gl) {
            console.error('Unable to initialize WebGL.');
            return;
        }

        this.gl = gl;
        this.time = 0.0;

        // Shader sources
        const vertexSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

        const fragmentSource = `
      precision highp float;

      uniform float width;
      uniform float height;
      vec2 resolution = vec2(width, height);

      uniform float time;

      #define POINT_COUNT 8

      vec2 points[POINT_COUNT];
      const float speed = -0.5;
      const float len = 0.25;
      float intensity = 1.3;
      float radius = 0.008;

      // Signed distance to a quadratic bezier
      float sdBezier(vec2 pos, vec2 A, vec2 B, vec2 C){    
        vec2 a = B - A;
        vec2 b = A - 2.0*B + C;
        vec2 c = a * 2.0;
        vec2 d = A - pos;

        float kk = 1.0 / dot(b,b);
        float kx = kk * dot(a,b);
        float ky = kk * (2.0*dot(a,a)+dot(d,b)) / 3.0;
        float kz = kk * dot(d,a);      

        float res = 0.0;
        float p = ky - kx*kx;
        float p3 = p*p*p;
        float q = kx*(2.0*kx*kx - 3.0*ky) + kz;
        float h = q*q + 4.0*p3;

        if(h >= 0.0){ 
          h = sqrt(h);
          vec2 x = (vec2(h, -h) - q) / 2.0;
          vec2 uv = sign(x)*pow(abs(x), vec2(1.0/3.0));
          float t = uv.x + uv.y - kx;
          t = clamp( t, 0.0, 1.0 );

          // 1 root
          vec2 qos = d + (c + b*t)*t;
          res = length(qos);
        } else {
          float z = sqrt(-p);
          float v = acos( q/(p*z*2.0) ) / 3.0;
          float m = cos(v);
          float n = sin(v)*1.732050808;
          vec3 t = vec3(m + m, -n - m, n - m) * z - kx;
          t = clamp( t, 0.0, 1.0 );

          // 3 roots
          vec2 qos = d + (c + b*t.x)*t.x;
          float dis = dot(qos,qos);
          
          res = dis;

          qos = d + (c + b*t.y)*t.y;
          dis = dot(qos,qos);
          res = min(res,dis);
          
          qos = d + (c + b*t.z)*t.z;
          dis = dot(qos,qos);
          res = min(res,dis);

          res = sqrt( res );
        }
        return res;
      }

      // Heart position
      vec2 getHeartPosition(float t){
        return vec2(16.0 * sin(t) * sin(t) * sin(t),
                    -(13.0 * cos(t) - 5.0 * cos(2.0*t)
                    - 2.0 * cos(3.0*t) - cos(4.0*t)));
      }

      // Glow effect
      float getGlow(float dist, float radius, float intensity){
        return pow(radius/dist, intensity);
      }

      float getSegment(float t, vec2 pos, float offset, float scale){
        for(int i = 0; i < POINT_COUNT; i++){
          points[i] = getHeartPosition(offset + float(i)*len + fract(speed * t) * 6.28);
        }
          
        vec2 c = (points[0] + points[1]) / 2.0;
        vec2 c_prev;
        float dist = 10000.0;
          
        for(int i = 0; i < POINT_COUNT-1; i++){
          c_prev = c;
          c = (points[i] + points[i+1]) / 2.0;
          dist = min(dist, sdBezier(pos, scale * c_prev, scale * points[i], scale * c));
        }
        return max(0.0, dist);
      }

      void main(){
        vec2 uv = gl_FragCoord.xy/resolution.xy;
        float widthHeightRatio = resolution.x/resolution.y;
        vec2 centre = vec2(0.5, 0.5);
        vec2 pos = centre - uv;
        pos.y /= widthHeightRatio;
        pos.y += 0.02;
        float scale = 0.000015 * height;

        float t = time;
          
        // Get first segment
        float dist = getSegment(t, pos, 0.0, scale);
        float glow = getGlow(dist, radius, intensity);

        vec3 col = vec3(0.0);
        col += 10.0*vec3(smoothstep(0.003, 0.001, dist));
        col += glow * vec3(1.0,0.05,0.3);
        
        // Get second segment
        dist = getSegment(t, pos, 3.4, scale);
        glow = getGlow(dist, radius, intensity);

        col += 10.0*vec3(smoothstep(0.003, 0.001, dist));
        col += glow * vec3(0.1,0.4,1.0);

        col = 1.0 - exp(-col);
        col = pow(col, vec3(0.4545));

        gl_FragColor = vec4(col,1.0);
      }
    `;

        // Compile and set up shaders
        this.program = this.setupShaderProgram(vertexSource, fragmentSource);
        if (!this.program) return;

        this.gl.useProgram(this.program);

        // Set up geometry
        const vertexData = new Float32Array([
            -1.0, 1.0,
            -1.0, -1.0,
            1.0, 1.0,
            1.0, -1.0,
        ]);

        const vertexDataBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexDataBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertexData, this.gl.STATIC_DRAW);

        const positionHandle = this.gl.getAttribLocation(this.program, "position");
        this.gl.enableVertexAttribArray(positionHandle);
        this.gl.vertexAttribPointer(positionHandle, 2, this.gl.FLOAT, false, 8, 0);

        // Set up uniforms
        this.timeHandle = this.gl.getUniformLocation(this.program, 'time');
        this.widthHandle = this.gl.getUniformLocation(this.program, 'width');
        this.heightHandle = this.gl.getUniformLocation(this.program, 'height');

        this.gl.uniform1f(this.widthHandle, window.innerWidth);
        this.gl.uniform1f(this.heightHandle, window.innerHeight);

        // Handle window resize
        window.addEventListener('resize', this.handleResize.bind(this));

        // Start animation
        this.lastFrame = Date.now();
        this.animate();
    }

    setupShaderProgram(vertexSource, fragmentSource) {
        // Compile vertex shader
        const vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
        this.gl.shaderSource(vertexShader, vertexSource);
        this.gl.compileShader(vertexShader);
        if (!this.gl.getShaderParameter(vertexShader, this.gl.COMPILE_STATUS)) {
            console.error("Vertex shader compile failed:", this.gl.getShaderInfoLog(vertexShader));
            return null;
        }

        // Compile fragment shader
        const fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        this.gl.shaderSource(fragmentShader, fragmentSource);
        this.gl.compileShader(fragmentShader);
        if (!this.gl.getShaderParameter(fragmentShader, this.gl.COMPILE_STATUS)) {
            console.error("Fragment shader compile failed:", this.gl.getShaderInfoLog(fragmentShader));
            return null;
        }

        // Create and link program
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error("Program link failed:", this.gl.getProgramInfoLog(program));
            return null;
        }

        return program;
    }

    animate() {
        if (!this.isActive) return;

        const thisFrame = Date.now();
        this.time += (thisFrame - this.lastFrame) / 1000;
        this.lastFrame = thisFrame;

        this.gl.uniform1f(this.timeHandle, this.time);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

        requestAnimationFrame(this.animate.bind(this));
    }

    handleResize() {
        if (!this.isActive) return;

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.uniform1f(this.widthHandle, window.innerWidth);
        this.gl.uniform1f(this.heightHandle, window.innerHeight);
    }

    show() {
        this.container.style.display = 'block';
        this.isActive = true;
        this.lastFrame = Date.now();
        this.animate();
    }

    hide() {
        this.isActive = false;
        this.container.style.display = 'none';
    }
}

export { HeartPreloader };