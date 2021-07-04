export class Texture {
    public constructor(
        public readonly width,
        public readonly height,
        public readonly handle: WebGLTexture
    ) {}

    public freeGlResources(gl: WebGL2RenderingContext) {
        gl.deleteTexture(this.handle);
    }
}

export class Textures {
    _textures = new Set<Texture>();

    public static defaultWhite: Texture = null;
    public static defaultBlack: Texture = null;

    public constructor(
        private _gl: WebGL2RenderingContext
    ) {}

    public createFromImage(image: HTMLImageElement): Texture {
        const gl = this._gl;

        const handle = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, handle);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);

        const texture = new Texture(image.width, image.height, handle);
        this._textures.add(texture);

        return texture;
    }

    public createFromRGBAData(width: number, height: number, data: ArrayBufferView): Texture {
        const gl = this._gl;

        const handle = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, handle);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data, 0);
        gl.generateMipmap(gl.TEXTURE_2D);

        const texture = new Texture(width, height, handle);
        this._textures.add(texture);

        return texture;
    }

    public async createFromUrl(url: string) {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.src = url;

        await image.decode();

        return this.createFromImage(image);
    }

    public async createFromBuffer(buffer: ArrayBuffer | ArrayBufferView, mimeType: string){
        const blob = new Blob([buffer], {type: mimeType});
        const url = URL.createObjectURL(blob);

        try {
            return await this.createFromUrl(url);
        }
        finally {
            URL.revokeObjectURL(url);
        }
    }

    public clear() {
        this._textures.forEach((texture: Texture) => {
            texture.freeGlResources(this._gl);
        });

        this._textures.clear();
    }
}