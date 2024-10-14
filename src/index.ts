import { commandOptions, createClient } from 'redis';
import { downloadFromS3, uploadFolderToS3 } from './middlewares/aws.handler';
import { buildProject } from './middlewares/project.build';
import { OUTPUT_DIR, R2_BUCKET, ROOT_DIR } from './constants';
const subscriber = createClient();
subscriber.connect();

async function main () {
    while(1) {
        const response = await subscriber.brPop(commandOptions({ isolated: true }), 'build-queue', 0);

        const storedId = response?.element;
        console.log(storedId);

        // Download source code by its id from AWS S3
        await downloadFromS3(R2_BUCKET, `sources/${storedId}`);

        // Build the project in sight
        await buildProject(`${OUTPUT_DIR}/${storedId}`);

        // Upload the built files back to AWS S3
        await uploadFolderToS3(R2_BUCKET, `builds`,`${OUTPUT_DIR}/${storedId}/.next`);
    }
}

main();
