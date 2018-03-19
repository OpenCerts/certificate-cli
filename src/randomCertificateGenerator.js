const fs = require("fs");
const { randomCertificate } = require("@govtechsg/open-certificate");

function generateRandomCertificate(num, dir, contractAddress) {
  for (let i = 0; i < num; i += 1) {
    const cert = randomCertificate(contractAddress);
    const certId = cert.id;
    fs.writeFileSync(`${dir}/${certId}.json`, JSON.stringify(cert, null, 2));
  }

  return num;
}

module.exports = {
  generateRandomCertificate
};
