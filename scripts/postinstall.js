const fs = require("fs-extra");
const path = require("path");

const projectRoot = path.join(__dirname, "..");
const nodeModulesDir = path.join(projectRoot, "node_modules");
const externalDir = path.join(projectRoot, "external");

if (!fs.existsSync(externalDir)) {
    fs.mkdirSync(externalDir);
}

const glMatrixSrcDir = path.join(nodeModulesDir, "gl-matrix", "esm");
const glMatrixDestDir = path.join(externalDir, "gl-matrix");
console.log(`Setting up gl-matrix: ${glMatrixSrcDir} ---> ${glMatrixDestDir}`);
fs.copySync(glMatrixSrcDir, glMatrixDestDir);

const jquerySrcFile = path.join(nodeModulesDir, "jquery", "dist", "jquery.min.js");
const jqueryDestDir = path.join(externalDir, "jquery.min.js");
console.log(`Setting up jquery: ${jquerySrcFile} ---> ${jqueryDestDir}`);
fs.copySync(jquerySrcFile, jqueryDestDir);