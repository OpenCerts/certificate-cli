const fs = require("fs");
const util = require("util");
const path = require("path");

const readdir = util.promisify(fs.readdir);

function readCert(directory, filename) {
  return JSON.parse(fs.readFileSync(path.join(directory, filename)));
}

function setFilename(filenameMap, documentId, filename) {
  if (documentId in filenameMap) {
    throw new Error(
      "There are duplicate IDs in the certificates to be batched up, please ensure that the ID fields in the certificates are unique."
    );
  } else {
    return Object.assign(filenameMap, { [documentId]: filename });
  }
}

function getRawCertificates(unsignedCertDir) {
  const unsignedCertDirPath = path.resolve(unsignedCertDir);
  return readdir(unsignedCertDirPath).then(items => {
    let filenameMap = {};
    const certificates = items.map(filename => {
      const document = readCert(unsignedCertDirPath, filename);
      filenameMap = setFilename(filenameMap, document.id, filename);
      return document;
    });
    return { filenameMap, certificates };
  });
}

function writeCertToDisk(destinationDir, filename, certificate) {
  fs.writeFileSync(
    path.join(path.resolve(destinationDir), filename),
    JSON.stringify(certificate, null, 2)
  );
}

module.exports = {
  getRawCertificates,
  writeCertToDisk
};
