const fs = require("fs");
const {
  issueCertificates
} = require("@govtechsg/open-certificate");

const { get } = require("lodash");

function batchIssue(inputDir, outputDir) {
  function getRawCertificates(path) {
    return new Promise((resolve, reject) => {
      fs.readdir(path, (err, items) => {
        if (err) return reject(err);

        const certificates = items.map(i =>
          JSON.parse(fs.readFileSync(path + i))
        );
        return resolve(certificates);
      });
    });
  }

  function getBatchRoot(documents) {
    const merkleRoots = documents.map(doc => {
      return get(doc, "signature.merkleRoot");
    });

    const setOfRoots = new Set(merkleRoots);
    if (setOfRoots.size > 1) {
      throw new Error(
        "Unexpected error: Merkel roots of certificates in the same batch differ."
      );
    } else if (setOfRoots.has(undefined) || setOfRoots.size === 0) {
      throw new Error("No signatures found in batch.");
    } else return merkleRoots[0];
  }

  return getRawCertificates(inputDir).then(certificates => {
    const batch = issueCertificates(certificates);
    const batchRoot = getBatchRoot(batch);

    batch.forEach(c => {
      const fileName = c.data.id;

      fs.writeFileSync(
        `${outputDir}${fileName}.json`,
        JSON.stringify(c, null, 2)
      );
    });

    return batchRoot;
  });
}

module.exports = batchIssue;
