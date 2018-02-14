const _ = require("lodash");

function Web3MockContractTxObject(methodName) {
  this.resolves = 0;
  this.results = null;
  this.expectedParam = null;
  this.passedParams = null;
}

// Sets the resolved value for this method.
// When `resolves` === true, the method resolves, otherwise it is rejected
// Value from results will be returns in resolve or reject
Web3MockContractTxObject.prototype.setResult = function(resolves, results) {
  this.resolves = resolves;
  this.results = results;
};

Web3MockContractTxObject.prototype.expectParams = function(...args) {
  this.expectedParam = args;
};

Web3MockContractTxObject.prototype.argumentCheck = function() {
  if (this.expectedParam && !_.isEqual(this.passedParams, this.expectedParam)) {
    throw new Error(`Argument mismatch
      Expected: ${this.expectedParam}
      Received: ${this.passedParams}`);
  }
};

Web3MockContractTxObject.prototype.call = function() {
  this.argumentCheck();

  return this.resolves
    ? Promise.resolve(this.results)
    : Promise.reject(this.results);
};

Web3MockContractTxObject.prototype.send = function() {
  this.argumentCheck();

  return this.resolves
    ? Promise.resolve(this.results)
    : Promise.reject(this.results);
};

function Web3MockContract(abi, address) {
  this.methodStore = {};
  this.expectedArguments = {};
  this.methods = {};
}

Web3MockContract.prototype.addMethod = function(methodName) {
  this.methodStore[methodName] = new Web3MockContractTxObject(methodName);
  this.methods[methodName] = (...args) => {
    this.methodStore[methodName].passedParams = args;
    return this.methodStore[methodName];
  };
};

Web3MockContract.prototype.expectedParams = function(
  methodName,
  expectedParams
) {
  this.expectedArguments[methodName] = expectedParams;
};

function Web3Mock() {
  this.eth = {
    Contract: Web3MockContract
  };
}

module.exports = Web3Mock;
