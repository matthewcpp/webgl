const path = require('path');
const fs = require("fs")

const rollup = require('rollup');
const loadConfigFile = require('rollup/dist/loadConfigFile');

const main = async () => {
    if (process.argv.length < 3) {
        console.log("Usage: node build.js (dev | dist)");
        process.exit(1);
    }

    const buildType = process.argv[2].toLowerCase();
    if (["dev", "dist"].indexOf(buildType) < 0) {
        console.log(`Unknown build type: ${process.argv[2]}`);
        process.exit(1);
    }

    console.log(`Building configuration: ${buildType}`);

    const buildDir = path.resolve(__dirname, `../dist`);
    const configFilePath = path.resolve(__dirname, "rollup.config.js");

    if (!fs.existsSync(buildDir))
        fs.mkdirSync(buildDir);

    // use rollup to compile and combine typescript
    await loadConfigFile(configFilePath).then(async ({options, warnings}) => {
        warnings.flush();

        const tasks = options.map(async options => {
            const bundle = await rollup.rollup(options);

            await Promise.all(options.output.map((output) => {
                if (buildType === "dev")
                    output.paths = { "gl-matrix": "/dist/gl-matrix/index.js"}

                return bundle.write(output);
            }));

        })
        await Promise.all(tasks);
    });

    if (buildType === "dev") {
        console.log("Setting up gl-matrix");
        const glMatrixSrcDir = path.resolve(__dirname, "..", "node_modules", "gl-matrix", "esm");
        const glMatrixDestDir = path.resolve(buildDir, "gl-matrix");

        if (!fs.existsSync(glMatrixDestDir)){
            fs.mkdirSync(glMatrixDestDir);
            const entries = fs.readdirSync(glMatrixSrcDir, {withFileTypes: true});

            for (const entry of entries) {
                if (!entry.isFile())
                    continue;

                fs.copyFileSync(path.resolve(glMatrixSrcDir, entry.name), path.resolve(glMatrixDestDir, entry.name));
            }
        }
    }
}

main();