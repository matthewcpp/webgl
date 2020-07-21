const fs = require("fs-extra");
const path = require("path");
const prepare = require("./prepare")

const projectRoot = path.join(__dirname, "..");
const distDir = path.join(projectRoot, "dist");
const externalDir = path.join(projectRoot, "external");
const externalDistDir = path.join(distDir, "external");
const includeDir = path.join(distDir, "include");
const shaderSrcDir = path.join(projectRoot, "shaders");
const shaderDestDir = path.join(distDir, "shaders");


const main = async () => {
    for (const dir of [distDir, externalDistDir, externalDir, includeDir]) {
        if (!fs.existsSync(dir))
            fs.mkdirSync(dir);
    }

    const glMatrixSrcDir = path.join(projectRoot, "node_modules", "gl-matrix", "esm");

    for (const dir of [externalDir, externalDistDir]) {
        const glMatrixDestDir = path.join(dir, "gl-matrix");

        console.log(`Installing gl-matrix: ${glMatrixSrcDir} ---> ${glMatrixDestDir}`);
        fs.copySync(glMatrixSrcDir, glMatrixDestDir);
    }

    if (!fs.existsSync(shaderDestDir)){
        console.log(`Creating shader output directory: ${shaderDestDir}`);
        fs.mkdirSync(shaderDestDir);
    }

    await prepare.shadersInFolder(shaderSrcDir, shaderDestDir);
}

main();