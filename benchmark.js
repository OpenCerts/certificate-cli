#!/usr/bin/env node
const fs = require("fs");
const mkdirp = require("mkdirp");
const yargs = require("yargs");
const {
  validateSchema,
  verifySignature,
  obfuscateFields
} = require("@govtechsg/open-certificate");
const batchIssue = require("./src/batchIssue");
const { logger, addConsole } = require("./lib/logger");
const profile = require("./lib/mem");

/*
const batch = async (raw, batched) => {
  mkdirp.sync(batched);
  profile();
  return batchIssue(raw, batched)
    .then(merkleRoot => {
      logger.info(`Batch Certificate Root: 0x${merkleRoot}`);
      profile();
      return `${merkleRoot}`;
    })
    .catch(err => {
      logger.error(err);
    });
};

addConsole();
batch("./load/unsigned", "./load/signed");
*/

// Read file in dir
