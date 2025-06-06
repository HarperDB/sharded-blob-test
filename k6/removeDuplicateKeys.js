import fs from 'fs';


function removeDuplicatesFromJsonFile(inputFilePath, outputFilePath) {
    try {

        console.log('Reading JSON file...');
        const rawData = fs.readFileSync(inputFilePath, 'utf8');
        const data = JSON.parse(rawData);

        console.log(`Original records count: ${data.length}`);


        const uniqueRecords = [...new Set(data)];

        console.log(`Unique records count: ${uniqueRecords.length}`);
        console.log(`Duplicates removed: ${data.length - uniqueRecords.length}`);


        fs.writeFileSync(outputFilePath, JSON.stringify(uniqueRecords, null, 2));

        console.log(`Unique records saved to: ${outputFilePath}`);

        return {
            originalCount: data.length,
            uniqueCount: uniqueRecords.length,
            duplicatesRemoved: data.length - uniqueRecords.length
        };

    } catch (error) {
        console.error('Error processing file:', error.message);
        throw error;
    }
}


const inputFile = './records_mihai.json';
const outputFile = './records_unique.json';


try {
    const result = removeDuplicatesFromJsonFile(inputFile, outputFile);
    console.log('\nSummary:', result);
} catch (error) {
    console.error('Failed to process file:', error.message);
}
