const rollup = require("rollup");
const resolve = require('@rollup/plugin-node-resolve');
const typescript = require ('rollup-plugin-typescript2');

const mkdirp = require('mkdirp');
const fs = require('fs-extra');

const path = require("path");

async function main() {
    if (process.argv.length < 3) {
        console.log("Usage: node build_example.js [example-name]");
        process.exit(1);
    }

    const exampleName = process.argv[2];
    const exampleDir = path.resolve(__dirname, "../examples", exampleName);
    const exampleConfig = path.join(exampleDir, "tsconfig.json");
    const exampleEntrypoint = path.join(exampleDir, "index.ts");

    const destDir = path.join(__dirname, "..", "dist", "examples", exampleName);
    const destJsPath = path.join(destDir, "index.js");

    if (!fs.existsSync(destDir)) {
        mkdirp.sync(destDir);
    }

    fs.copySync(exampleDir, destDir, {filter: (src, dest) => {
        if (path.extname(src) === ".ts" || path.basename(src) === "tsconfig.json")
            return false;

        return true;
    }});

    const inputOptions = {
        input: exampleEntrypoint,
        external: [ "gl-matrix", "webgl" ],
        plugins: [
            resolve.nodeResolve(),
            typescript({
                tsconfig: exampleConfig,
                typescript: require('typescript'),
            })
        ]
    };

    const outputOptions = {
        file: destJsPath,
        format: "es",
        paths: {
            "gl-matrix": "../../gl-matrix/index.js",
            "webgl": "../../webgl.es.js"
        }
    }

    if (!fs.existsSync(exampleDir)) {
        console.log(`Example: ${exampleName} does not exist.`);
        process.exit(1);
    }

    if (!fs.existsSync(exampleConfig)) {
        console.log(`Config file: ${exampleConfig} does not exist`);
        process.exit(1);
    }

    const bundle = await rollup.rollup(inputOptions);
    await bundle.write(outputOptions);
}

if (require.main === module) {
    main();
}