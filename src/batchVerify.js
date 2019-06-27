const { readCert, documentsInDirectory } = require("./diskUtils");
const { verifySignature } = require("@govtechsg/tradetrust-schema");
const { logger } = require("../lib/logger");

const batchVerify = async undigestedCertDir => {
  const certFileNames = await documentsInDirectory(undigestedCertDir);
  let allVerified = true;
  certFileNames.forEach(file => {
    const document = readCert(undigestedCertDir, file);
    const verified = verifySignature(document);
    allVerified = allVerified && verified;
    if (verified) {
      logger.debug(`${file}: Verified`);
    } else {
      logger.error(`${file}: ======= VERIFICATION FAILED =======`);
    }
  });
  return allVerified;
};

module.exports = batchVerify;
