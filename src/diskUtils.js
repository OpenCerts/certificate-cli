const fs = require("fs");
const util = require("util");
const path = require("path");
const { filter, some } = require("lodash");

const readdir = util.promisify(fs.readdir);

const opencertsFileExtensions = [/(.*)(\.)(opencert)$/, /(.*)(\.)(json)$/];

function readCert(directory, filename) {
  return JSON.parse(fs.readFileSync(path.join(directory, filename)));
}

function isOpenCertFileExtension(filename) {
  return some(
    opencertsFileExtensions.map(mask => mask.test(filename.toLowerCase()))
  );
}

function setFilename(filenameMap, documentId, filename) {
  return Object.assign(filenameMap, { [documentId]: filename });
}

// Returns all opencerts file in directory
const certificatesInDirectory = async dir => {
  const items = await readdir(dir);
  return filter(items, isOpenCertFileExtension);
};

async function getRawCertificates(unsignedCertDir) {
  const unsignedCertDirPath = path.resolve(unsignedCertDir);
  const certFiles = await certificatesInDirectory(unsignedCertDirPath);
  let filenameMap = {};
  const certificates = certFiles.map(filename => {
    const document = readCert(unsignedCertDirPath, filename);
    filenameMap = setFilename(filenameMap, document.id, filename);
    return document;
  });
  return { filenameMap, certificates };
}

function writeCertToDisk(destinationDir, filename, certificate) {
  fs.writeFileSync(
    path.join(path.resolve(destinationDir), filename),
    JSON.stringify(certificate, null, 2)
  );
}

module.exports = {
  getRawCertificates,
  certificatesInDirectory,
  writeCertToDisk,
  readCert,
  readdir
};
