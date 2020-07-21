const path = require("path");
const readline = require("readline");
const os = require("os");
const fs = require("fs");

const includeRegex = new RegExp('#include\\s+"(.+)"\\s*')

async function processFile(filePath) {
    const dir = path.dirname(filePath);
    let fileStr = "";

    const rl = readline.createInterface({
        input: fs.createReadStream(filePath),
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        const reMatch = line.match(includeRegex);

        if (reMatch){
            const includePath = path.join(dir, reMatch[1]);
            if (!fs.existsSync(includePath))
                throw new Error(`${filePath}: Cannot locate include file: ${includePath}`);

            fileStr += await processFile(includePath);
        }
        else {
            fileStr += line;
        }

        fileStr += os.EOL;
    }

    return fileStr;
}

async function prepareShader(filePath, outPath) {
    if (!fs.existsSync(filePath))
        throw new Error(`Unable to prepare shader: ${filePath} does not exist`);

    const shaderText = await processFile(filePath)
    fs.writeFileSync(outPath, shaderText);
}

const supportedFileEndings = [".vert.glsl", ".frag.glsl"];

function fileEndingMatches(file) {
    for (const ending of supportedFileEndings) {
        if (file.endsWith(ending))
            return true;
    }

    return false;
}

async function prepareShadersInFolder(shaderDir, destDir) {
    if (!fs.existsSync(shaderDir))
        throw new Error(`Source shader dir: ${shaderDir} does not exist.`);

    const files = fs.readdirSync(shaderDir);

    for (const file of files) {
        const srcFile = path.join(shaderDir, file);
        const stats = fs.statSync(srcFile);

        if (stats.isFile() && fileEndingMatches(file)) {
            const destFile = path.join(destDir, file);
            await prepareShader(srcFile, destFile);
        }
    }
}

module.exports = {
    shader: prepareShader,
    shadersInFolder: prepareShadersInFolder
};