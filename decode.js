const {
  issueCertificates,
  certificateData
} = require("@govtechsg/open-certificate");
const fs = require("fs");
const cert = require("./load/certificate.json");

fs.writeFileSync("raw.json", JSON.stringify(certificateData(cert), null, 2));
