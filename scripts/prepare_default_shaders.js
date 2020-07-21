const prepare = require("./prepare");

const path = require("path");

const shaderDir = path.join(__dirname, "..", "shaders");
const destDir = path.join(__dirname, "..", "dist", "shaders");

const main = async()  => {
    await prepare.shadersInFolder(shaderDir, destDir);
}

main();