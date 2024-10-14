import fs from 'fs';
import path from 'path';

export const isExisted = (filePath: string) => {
    return fs.existsSync(filePath);
}

export const mkDirSync = (folderPath: string) => {
    if (!isExisted(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true })
    }
}

export const writeStream = (filePath: string) => {
    const dirName = path.dirname(filePath);
    mkDirSync(dirName);

    return fs.createWriteStream(filePath);
}

export const readStream = (filePath: string) => {
    return fs.createReadStream(filePath);
}

// filePath: D:\\WorkSpace\\Backend\\clean-architecture-api\\dist\\output\\2f95dh\\src\\controllers\\message.controller.js
export const readFile = (filePath: string) => {
    return fs.readFileSync(filePath);
}

// Get all folders and files in recursion
export const getAllFiles = (folderPath: string) => {
    let result: string[] = [];

    // Read all files from given folder
    const rootFolder = fs.readdirSync(folderPath)

    // Loop through all files in the folder
    rootFolder.forEach(file => {
        // Join filePath with folderPath to get full path
        const filePath = path.posix.join(folderPath, file);

        // If it's a folder -> concat the filePath List with recursion of children folder's files
        // Else just push remain files to the filePath List
        if (fs.statSync(filePath).isDirectory()) {
            result = result.concat(getAllFiles(filePath));
        }
        else {
            result.push(filePath);
        }
    })

    return result;
}
