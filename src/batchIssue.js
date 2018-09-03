const fs = require("fs");
const path = require("path");
const {
  issueCertificates,
  certificateData
} = require("@govtechsg/open-certificate");

const { get } = require("lodash");

function getRawCertificates(unsignedCertDir) {
  const unsignedCertDirPath = path.resolve(unsignedCertDir);
  return new Promise((resolve, reject) => {
    fs.readdir(unsignedCertDirPath, (err, items) => {
      if (err) return reject(err);

      const filenameMap = {};
      const certificates = items.map(i => {
        const document = JSON.parse(
          fs.readFileSync(path.join(unsignedCertDir, i))
        );
        filenameMap[document.id] = i;
        return document;
      });
      return resolve({ filenameMap, certificates });
    });
  });
}

function getBatchRoot(documents) {
  const merkleRoots = documents.map(doc => get(doc, "signature.merkleRoot"));

  const setOfRoots = new Set(merkleRoots);
  if (setOfRoots.size > 1) {
    throw new Error(
      "Unexpected error: Merkel roots of certificates in the same batch differ."
    );
  } else if (setOfRoots.has(undefined) || setOfRoots.size === 0) {
    throw new Error("No signatures found in batch.");
  } else return merkleRoots[0];
}

function writeCertToDisk(destinationDir, filename, certificate) {
  fs.writeFileSync(
    path.join(path.resolve(destinationDir), filename),
    JSON.stringify(certificate, null, 2)
  );
}

function makeFilename(filenameMap, certificate) {
  const certData = certificateData(certificate); // get unsalted document data to retrieve ID
  return filenameMap[certData.id];
}

function batchIssue(inputDir, outputDir) {
  return getRawCertificates(inputDir).then(documents => {
    const batch = issueCertificates(documents.certificates);
    const batchRoot = getBatchRoot(batch);

    batch.forEach(certificate => {
      const signedCertFilename = makeFilename(
        documents.filenameMap,
        certificate
      );
      writeCertToDisk(outputDir, signedCertFilename, certificate);
    });
    return batchRoot;
  });
}

module.exports = batchIssue;
