import { exec } from 'child_process';
import path from 'path';

const runCommand = (command: string, workingDir: string) => {
    return new Promise((resolve, reject) => {
        const child = exec(command, { cwd: workingDir }, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing command: ${command}`);
                console.error(stderr);
                reject(error);
            } else {
                // console.log(stdout);
                resolve(stdout);
            }
        })

        child.stdout?.on('data', (data) => {
            console.log(data.toString());
        })

        child.stderr?.on('data', (data) => {
            console.error(data.toString());
        })
    })
};

export const buildProject = async (folderPath: string) => {
    try {
        console.log('📦 Installing dependencies...');
        await runCommand('npm install', folderPath);

        console.log('🚀 Building the project...');
        await runCommand('npm run build', folderPath);
        
        console.log('✔️ Project built successfully.');
    } catch (error) {
        console.error('Error during the build process:', error);
    }
};
