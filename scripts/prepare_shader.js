const prepare = require("./prepare");

const main = async () => {
    if (process.argv < 4) {
        console.log("Usage: node prepare_shader.js path/to/source path/to/output");
        process.exit(1);
    }

    const inputFile = process.argv[2];
    const outputFile = process.argv[3];

    await prepare.shader(inputFile, outputFile);

};

main();
