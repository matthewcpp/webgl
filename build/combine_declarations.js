const fs = require("fs");
const path = require("path");
const os = require("os")

const ignoredFiles = ["WebGL.d.ts", "Schema.d.ts"];

function combineDeclarationsInDirectory(rootDirectory, outFile) {
    if (!fs.existsSync(rootDirectory)) {
        throw new Error(`Supplied types directory: ${rootDirectory} does not exist`);
    }


    let output = 'declare module "webgl" {';
    output += os.EOL;

    output += 'import {vec3, vec4, mat4, quat} from "gl-matrix"';
    output += os.EOL;

    const directories = [rootDirectory];

    while (directories.length > 0) {
        const directory = directories.pop();
        const entries = fs.readdirSync(directory, {withFileTypes: true});

        for (const entry of entries) {
            const fullPath = path.join(directory, entry.name);
            if (entry.isFile()) {
                if (!fullPath.endsWith(".d.ts"))
                    continue;

                if (ignoredFiles.indexOf(entry.name) >= 0)
                    continue;

                output += `// ${entry.name}`;
                output += os.EOL;

                const fileData = fs.readFileSync(fullPath, 'UTF-8');
                const lines = fileData.split(/\r?\n/);

                for (const line of lines) {
                    if (line.startsWith("import"))
                        continue;

                    if (line.startsWith("export declare"))
                        output += line.replace("export declare", "")
                    else
                        output += line;

                    output += os.EOL;
                }
            }
            else if (entry.isDirectory()){
                directories.push(fullPath);
            }
        }
    }

    output += "}";

    fs.writeFileSync(outFile, output);
}

export default function combineDeclarations(options) {
    const opts = Object.assign({removeInputDir: true}, options);

    if (!opts.hasOwnProperty("inputDir"))
        throw new Error("you must an input directory");

    if (!opts.hasOwnProperty("outputFile")) {
        throw new Error("you must specify an output file");
    }

    return {
        name: "combine-declarations",
        writeBundle: () => {
            combineDeclarationsInDirectory(opts.inputDir, opts.outputFile);

            if (opts.removeInputDir)
                fs.rmdirSync(opts.inputDir, {recursive: true});
        }
    }
}