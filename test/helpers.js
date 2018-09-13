const { addConsole } = require("../lib/logger");

addConsole("debug");

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");

chai.should();
chai.use(chaiAsPromised);

global.expect = chai.expect;
global.assert = chai.assert;
