import {Texture} from "./Texture";

export class RenderTarget {
    public constructor(
        private _width: number,
        private _height: number,
        private _handle: WebGLFramebuffer,
        private _colorTexture: Texture,
        private _depthTexture: Texture
    ) {
    }

    public freeGlResources(gl: WebGL2RenderingContext): void {
        this._colorTexture.freeGlResources(gl);
        this._depthTexture.freeGlResources(gl);

        gl.deleteFramebuffer(this._handle);
    }

    public get colorTexture(): Texture {
        return this._colorTexture;
    }

    public get depthTexture(): Texture {
        return  this._depthTexture;
    }

    public get handle() {
        return this._handle;
    }

    public get width() {
        return this._colorTexture.width;
    }

    public get height() {
        return this._colorTexture.height;
    }
}


export class RenderTargets {
    public items: RenderTarget[] = [];

    public constructor(
        private _gl: WebGL2RenderingContext
    ) {}

    public create(width: number, height: number): RenderTarget {
        const gl = this._gl;

        const colorTexture = this._createColorTexture(width, height);
        const depthTexture = this._createDepthTexture(width, height);

        const framebuffer = gl.createFramebuffer();
        this._gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTexture.handle, 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture.handle, 0);

        const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

        if (status !== gl.FRAMEBUFFER_COMPLETE) {
            colorTexture.freeGlResources(gl);
            depthTexture.freeGlResources(gl);

            throw new Error("Failed to create render target");
        }

        const renderTarget = new RenderTarget(width, height, framebuffer, colorTexture, depthTexture);

        this.items.push(renderTarget);

        return renderTarget;
    }

    private _createColorTexture(width: number, height: number) {
        const gl = this._gl;

        const colorTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, colorTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, width, height, 0, gl.RGB, gl.UNSIGNED_BYTE, null);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindTexture(gl.TEXTURE_2D, null);

        return new Texture(width, height, colorTexture);
    }

    private _createDepthTexture(width: number, height: number) {
        const gl = this._gl;

        const depthTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, depthTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, width, height, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindTexture(gl.TEXTURE_2D, null);

        return new Texture(width, height, depthTexture);
    }

    public clear() {
        for (const renderTarget of this.items) {
            renderTarget.freeGlResources(this._gl);
        }

        this.items = [];
    }
}