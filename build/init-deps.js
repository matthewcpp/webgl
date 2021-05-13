const mkdirp = require('mkdirp');
const fs = require('fs-extra');

const path = require("path");

const glMatrixSourceDir = path.resolve(__dirname, "..", "node_modules", "gl-matrix", "esm");
const glMatrixDestDir = path.resolve(__dirname, "..", "dist", "gl-matrix");

if (!fs.existsSync(glMatrixSourceDir)) {
    console.log("unable to locate gl-matrix.  Do you need to run npm install?");
    process.exit(1);
}

if (!fs.existsSync(glMatrixDestDir)) {
    mkdirp.sync(glMatrixDestDir);
}

fs.copySync(glMatrixSourceDir, glMatrixDestDir);