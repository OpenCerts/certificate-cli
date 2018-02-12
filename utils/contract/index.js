const Web3 = require("web3");

const web3 = new Web3(Web3.givenProvider || "ws://localhost:8545");

const {
  abi,
  bytecode
} = require("../../node_modules/certificate-contract/build/contracts/CertificateStore.json");

function CertificateStore(issuerAccount, address) {
  this.account = issuerAccount;
  this.contract = new web3.eth.Contract(abi, address);
}

CertificateStore.prototype.name = function() {
  return this.contract.methods.name().call();
};

CertificateStore.prototype.verificationUrl = function() {
  return this.contract.methods.verificationUrl().call();
};

CertificateStore.prototype.owner = function() {
  return this.contract.methods.owner().call();
};

CertificateStore.prototype.getIssuedBlock = function(merkleRoot) {
  return this.contract.methods.getIssuedBlock(merkleRoot).call();
};

CertificateStore.prototype.isBatchIssued = function(merkleRoot) {
  return this.contract.methods.isBatchIssued(merkleRoot).call();
};

CertificateStore.prototype.isRevoked = function(merkleRoot) {
  return this.contract.methods.isRevoked(merkleRoot).call();
};

CertificateStore.prototype.transferOwnership = function(newOwner) {
  return this.contract.methods
    .transferOwnership(newOwner)
    .send({ from: this.account });
};

CertificateStore.prototype.issueBatch = function(hash) {
  return this.contract.methods.issueBatch(hash).send({ from: this.account });
};

CertificateStore.prototype.revokeClaim = function(merkleRoot, claim, reason) {
  return this.contract.methods
    .revokeClaim(merkleRoot, claim, reason)
    .send({ from: this.account });
};

CertificateStore.prototype.deploy = function(name, verificationUrl) {
  return this.contract
    .deploy({
      data: bytecode,
      arguments: [name, verificationUrl]
    })
    .send({ from: this.account, gas: 1500000, gasPrice: "20000000000" })
    .then(contract => {
      const address = contract._address;
      this.contract = new web3.eth.Contract(abi, address);
      return address;
    });
};

// Test
// const certificateStoreAddress = '0x345ca3e014aaf5dca488057592ee47305d9b3e10';
const issuerAccount = "0x627306090abaB3A6e1400e9345bC60c78a8BEf57";
const store = new CertificateStore(issuerAccount);

/*
store.revokeClaim('0x345ca3e014aaf5dca488057592ee47305d9b3e10', '0x345ca3e014aaf5dca488057592ee47305d9b3e10', 2)
.then(console.log)
*/

store
  .deploy("GovTech DLT Team", "https://tech.gov.sg/")
  .then(address => {
    console.log("Contract deployed at:", address);
    return store.issueBatch("0x627306090abaB3A6e1400e9345bC60c78a8BEf57");
  })
  .then(() => {
    console.log("Done issuing");
  });

module.exports = CertificateStore;
