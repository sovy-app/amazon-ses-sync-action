const core = require('@actions/core');
const fs = require('fs');
const axios = require('axios');

function getNameFromFileName(fileName) {
  const fileNameParts = fileName.split('.');
  if (fileNameParts.length === 1) return fileName;
  fileNameParts.pop();
  return fileNameParts.join('.');
}

function getSubjectFromFileContent(content) {
  const regexp = /<!-- subject:(.*)-->/mi
  const match = content.match(regexp);
  if (!match || match.length < 2 || !match[1]) return '';
  return match[1].trim();
}

async function main() {
  try {
    const templatesDir = core.getInput('templates_dir');
    const token = core.getInput('token');

    if (!templatesDir) {
      core.setFailed('Input parameter templates_dir is missing.');
      return;
    }

    if (!token) {
      core.setFailed('Input parameter token is missing.');
      return;
    }

    core.info(`Templates directory: ${templatesDir}`);
    core.info('.');

    const templateFileNames = fs.readdirSync(templatesDir);
    core.info(`Found ${templateFileNames.length} files in the provided directory:`);
    templateFileNames.forEach((fileName, index) => core.info(`${index + 1}. ${fileName}`));
    core.info('.');

    core.info('Reading files...');
    const templateFiles = templateFileNames.map((fileName) => ({
      name: fileName,
      content: fs.readFileSync(`${templatesDir}${fileName}`, { encoding: 'utf8' }),
    }));
    core.info(`All ${templateFiles.length} files read successfully.`);
    core.info('.');

    core.info('Parsing files...');
    const emailTemplates = templateFiles.map((templateFile, index) => {
      core.info(`Parsing file ${index + 1}. ${templateFile.name}`);
      return {
        name: getNameFromFileName(templateFile.name),
        subject: getSubjectFromFileContent(templateFile.content),
        html: templateFile.content,
      };
    });
    core.info(`All ${emailTemplates.length} files parsed successfully.`);

    core.info('Syncing email templates...');
    await Promise.all(emailTemplates.map(template => {
      core.info(`Syncing ${template.name}`);
      return axios.post(`https://sovy.app/api/sync/${token}`, template);
    }));
    core.info(`All ${emailTemplates.length} templates synced successfully.`);
    core.info('.');

    core.info('Deleting missing synced templates...');
    await axios.post(`https://sovy.app/api/sync/${token}/clear`, templateFileNames.map(getNameFromFileName));
    core.info(`All missing synced templates successfully deleted from Amazon SES.`);
    core.info('.');

    core.info('\u001b[32mAll good, we\'re done here!');
  } catch (error) {
    core.setFailed(error.message);
  }
}

main();
