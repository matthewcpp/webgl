export class Texture {
    public static defaultTexture: WebGLTexture = null;

    public static createDefault(gl: WebGL2RenderingContext) {
        Texture.defaultTexture = Texture.createFromRGBAData(gl, 1, 1, new Uint8Array([255, 255, 255, 255]));
    }
    public static createFromImage(gl: WebGL2RenderingContext, image: HTMLImageElement): WebGLTexture {
        const texture = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);

        return texture;
    }

    public static createFromRGBAData(gl: WebGL2RenderingContext, width: number, height: number, data: ArrayBufferView) {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data, 0);
        gl.generateMipmap(gl.TEXTURE_2D);

        return texture;
    }
}