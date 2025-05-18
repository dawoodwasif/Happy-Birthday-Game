export class HeartPreloader {
    private canvas: HTMLCanvasElement;
    private gl: WebGLRenderingContext;
    private program: WebGLProgram;
    // Update types to allow null values
    private timeHandle: WebGLUniformLocation | null;
    private widthHandle: WebGLUniformLocation | null;
    private heightHandle: WebGLUniformLocation | null;
    private time: number = 0;
    private animationFrame: number | null = null;
    private lastFrame: number = Date.now();

    constructor() {
        console.log('HeartPreloader constructor');
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'heart-preloader';

        // Apply basic styles to the canvas
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';

        const gl = this.canvas.getContext('webgl');
        if (!gl) {
            console.error('Unable to initialize WebGL. Your browser may not support it.');
            throw new Error('WebGL not supported');
        }

        this.gl = gl;
        this.program = this.setupWebGL();
        this.timeHandle = gl.getUniformLocation(this.program, 'time');
        this.widthHandle = gl.getUniformLocation(this.program, 'width');
        this.heightHandle = gl.getUniformLocation(this.program, 'height');
    }

    public init() {
        console.log('HeartPreloader init');
        const preloaderContainer = document.getElementById('preloader');
        if (!preloaderContainer) {
            console.error('Preloader container not found in init');
            return;
        }

        // Set canvas dimensions
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        // Update WebGL viewport and uniforms
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        // Add null checks before using uniform locations
        if (this.widthHandle) {
            this.gl.uniform1f(this.widthHandle, this.canvas.width);
        }

        if (this.heightHandle) {
            this.gl.uniform1f(this.heightHandle, this.canvas.height);
        }

        // Add canvas to preloader container if not already there
        if (!preloaderContainer.contains(this.canvas)) {
            preloaderContainer.appendChild(this.canvas);
        }

        // Add resize listener
        window.addEventListener('resize', this.handleResize);

        // Start animation loop
        this.animationFrame = requestAnimationFrame(this.draw);

        // Add loading text
        this.addLoadingText(preloaderContainer);
    }

    public stop() {
        console.log('HeartPreloader stop');
        if (this.animationFrame !== null) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }

        // Remove resize listener
        window.removeEventListener('resize', this.handleResize);

        // Remove canvas from DOM if it exists
        if (this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }

        // Remove loading text if it exists
        const loadingText = document.getElementById('loading-text');
        if (loadingText && loadingText.parentNode) {
            loadingText.parentNode.removeChild(loadingText);
        }
    }

    private handleResize = () => {
        if (!this.canvas) return;

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        // Add null checks
        if (this.widthHandle) {
            this.gl.uniform1f(this.widthHandle, this.canvas.width);
        }

        if (this.heightHandle) {
            this.gl.uniform1f(this.heightHandle, this.canvas.height);
        }
    };

    private draw = () => {
        const thisFrame = Date.now();
        this.time += (thisFrame - this.lastFrame) / 1000;
        this.lastFrame = thisFrame;

        // Add null check
        if (this.timeHandle) {
            this.gl.uniform1f(this.timeHandle, this.time);
        }

        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

        this.animationFrame = requestAnimationFrame(this.draw);
    };

    private addLoadingText(container: HTMLElement) {
        // Check if text already exists
        let loadingText = document.getElementById('loading-text');
        if (!loadingText) {
            loadingText = document.createElement('div');
            loadingText.id = 'loading-text';
            loadingText.innerText = 'Loading...';
            loadingText.style.position = 'absolute';
            loadingText.style.top = '60%';
            loadingText.style.left = '0';
            loadingText.style.width = '100%';
            loadingText.style.textAlign = 'center';
            loadingText.style.color = 'white';
            loadingText.style.fontFamily = 'Arial, sans-serif';
            loadingText.style.fontSize = '24px';

            // Add birthday text
            const birthdayText = document.createElement('div');
            birthdayText.innerText = '';
            birthdayText.style.fontSize = '32px';
            birthdayText.style.marginBottom = '20px';
            birthdayText.style.color = '#ff3366';
            birthdayText.style.fontWeight = 'bold';

            loadingText.prepend(birthdayText);
            container.appendChild(loadingText);
        }
    }

    private setupWebGL(): WebGLProgram {
        const gl = this.gl;

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

        // Compile shaders
        const vertexShader = this.compileShader(vertexSource, gl.VERTEX_SHADER);
        const fragmentShader = this.compileShader(fragmentSource, gl.FRAGMENT_SHADER);

        const program = gl.createProgram();
        if (!program) {
            throw new Error('Failed to create WebGL program');
        }

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Unable to initialize the shader program:', gl.getProgramInfoLog(program));
            throw new Error('Failed to link shaders');
        }

        gl.useProgram(program);

        const vertexData = new Float32Array([
            -1.0, 1.0,
            -1.0, -1.0,
            1.0, 1.0,
            1.0, -1.0,
        ]);

        const vertexDataBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexDataBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);

        const positionHandle = gl.getAttribLocation(program, "position");
        gl.enableVertexAttribArray(positionHandle);
        gl.vertexAttribPointer(positionHandle, 2, gl.FLOAT, false, 8, 0);

        return program;
    }

    private compileShader(shaderSource: string, shaderType: number): WebGLShader {
        const gl = this.gl;
        const shader = gl.createShader(shaderType);

        if (!shader) {
            throw new Error(`Failed to create shader of type ${shaderType}`);
        }

        gl.shaderSource(shader, shaderSource);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error("Shader compile failed:", gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            throw new Error('Failed to compile shader');
        }

        return shader;
    }
}