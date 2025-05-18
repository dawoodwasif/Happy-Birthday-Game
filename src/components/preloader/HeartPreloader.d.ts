export class HeartPreloader {
    constructor(containerId: string);
    canvas: HTMLCanvasElement;
    container: HTMLElement;
    isActive: boolean;
    gl: WebGLRenderingContext;
    time: number;
    program: WebGLProgram;
    timeHandle: WebGLUniformLocation;
    widthHandle: WebGLUniformLocation;
    heightHandle: WebGLUniformLocation;
    lastFrame: number;

    init(): void;
    setupShaderProgram(vertexSource: string, fragmentSource: string): WebGLProgram | null;
    animate(): void;
    handleResize(): void;
    show(): void;
    hide(): void;
}