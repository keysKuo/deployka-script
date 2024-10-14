import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { OUTPUT_DIR, R2_ACCESS_KEY_ID, R2_ENDPOINT, R2_SECRET_ACCESS_KEY } from '../constants';
import { getAllFiles, readFile, readStream, writeStream } from './file.handler';
import path from 'path';
import { Readable } from 'stream';


const s3Client = new S3Client({
    region: 'us-east-1', // replace with your region if different
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID || "",
        secretAccessKey: R2_SECRET_ACCESS_KEY || ""
    },
    endpoint: R2_ENDPOINT,
    forcePathStyle: true,
});

export const uploadToS3 = async (bucket: string, storedPath: string, originalPath: string) => {
    const fileContent = readFile(originalPath);

    const uploadParams = {
        Bucket: bucket,
        Key: storedPath,
        Body: fileContent,
    };

    try {
        const command = new PutObjectCommand(uploadParams);
        const response = await s3Client.send(command);
        console.log(response);
    } catch (error) {
        console.error('Error uploading to S3:', error);
    }
}

export const uploadFolderToS3 = async (bucket: string, storedPath: string, folderPath: string) => {
    try {
        const allFiles = getAllFiles(folderPath);

        const uploadPromises = allFiles.map(async (file) => {
            const stream = readStream(file);
            const uploadParams = {
                Bucket: bucket,
                Key: path.posix.join(storedPath, file.split(OUTPUT_DIR)[1]),
                Body: stream,
            };

            const command = new PutObjectCommand(uploadParams);
            console.log(`Uploading: ${file}...`);

            await s3Client.send(command);
            console.log(`Uploaded: ${file} successfully.`);
        })

        await Promise.all(uploadPromises);
        console.log('All files uploaded successfully.');
    }
    catch (error) {
        console.error('Error uploading files to S3:', error);
    }
}

export const deleteFromS3 = async (bucket: string, folderPath: string) => {
    try {
        // Bước 1: Liệt kê các đối tượng trong thư mục
        const listCommand = new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: folderPath,
        });

        const listedObjects = await s3Client.send(listCommand);

        if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
            console.log('No objects found in the specified folder.');
            return;
        }

        // Bước 2: Tạo danh sách các đối tượng cần xóa
        const deleteParams = {
            Bucket: bucket,
            Delete: { Objects: listedObjects.Contents.map(({ Key }) => ({ Key })) },
        };

        const deleteCommand = new DeleteObjectsCommand(deleteParams);
        await s3Client.send(deleteCommand);

        console.log(`Successfully deleted folder: ${folderPath}`);
    } catch (error) {
        console.error('Error deleting folder:', error);
    }
}

export const downloadFromS3 = async (bucket: string, folderPath: string) => {
    try {
        const listCommand = new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: folderPath,
        });

        const listedObjects = await s3Client.send(listCommand);

        if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
            console.log('No objects found in the specified folder.');
            return;
        }


        const downloadPromises = listedObjects.Contents.map(async ({ Key }) => {
            if (!Key) return;

            const getCommand = new GetObjectCommand({
                Bucket: bucket,
                Key: Key
            });

            const fullFilePath = path.posix.join(OUTPUT_DIR, Key.split("sources/")[1]);
            console.log(fullFilePath);
            const response = await s3Client.send(getCommand);
            const stream = writeStream(fullFilePath);

            console.log(`Downloading: ${fullFilePath}...`);

            if (response.Body instanceof Readable) {
                response.Body.pipe(stream);
            } else {
                // Convert response.Body to a Node.js Readable stream
                const streamBody = Readable.from(response.Body as any);
                streamBody.pipe(stream);
            }

            return new Promise<void>((resolve, reject) => {
                stream.on('finish', () => {
                    console.log(`Downloaded: ${fullFilePath} successfully.`);
                    resolve();
                });
                stream.on('error', reject);
            });
        })

        await Promise.all(downloadPromises);
        console.log('All files downloaded successfully.');
    } catch (error) {
        console.error('Error downloading files from folder:', error);
    }
}
