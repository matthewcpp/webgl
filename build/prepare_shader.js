const path = require("path");
const fs = require("fs");

const includeRegex = new RegExp('#include\\s+"(.+)"\\s*')

export default function prepareShader(filePath) {
    const dir = path.dirname(filePath);
    let fileStr = "";

    const fileData = fs.readFileSync(filePath, 'UTF-8');
    const lines = fileData.split(/\r?\n/);

    for (const l of lines) {
        const line = l.trim();
        if (line.length === 0)
            continue;

        const reMatch = line.match(includeRegex);

        if (reMatch){
            const includePath = path.join(dir, reMatch[1]);
            if (!fs.existsSync(includePath))
                throw new Error(`${filePath}: Cannot locate include file: ${includePath}`);

            fileStr += prepareShader(includePath);
        }
        else {
            fileStr += line;
        }

        fileStr += "\\n"
    }

    return fileStr;
}