const core = require('@actions/core');
const styles = require('ansi-styles');
const fs = require('fs');

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
      content: fs.readFileSync(`${templatesDir}${fileName}`),
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

    core.info('Synching email templates...');
    await Promise.all(emailTemplates.map(template => {
      core.info(`Synching ${template.name}`);
      return fetch(`https://sovy.app/api/synch/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(template),
      });
    }));
    core.info(`All ${emailTemplates.length} templates synched successfully.`);
    core.info('.');
    core.info(`${styles.green.open}All good, we're done here!${styles.green.close}`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

main();
