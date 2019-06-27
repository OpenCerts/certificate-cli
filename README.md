# Document CLI tool

## Setup

```bash
npm install
```

## Batching Documents

This command process all documents in the input directory and issue all of them in a single
batch. It will then add the signature to the individual documents.

```bash
./index.js batch <PathToUnsignedDocuments> <PathToSignedDocuments>
```

Example:

```bash
./index.js batch ./documents/raw-documents/ ./documents/processed-documents/

2019-02-11T08:37:44.848Z info: Batch Document Root: 0xf51030c5751a646284c898cff0f9d833c64a50d6f307b61f2c96c3c838b13bfc
```

## Verifying All Signed Document in a Directory

This command verifies that the document (and all it's evidence) is valid and is part of the document batch. However, it does not verify that the batch's merkle root is stored on the blockchain. User will need to verify that the document has indeed been issued by checking with the issuer's smart contract.

```bash
./index.js verify-all <PathToDocument>
```

Example:

```bash
./index.js verify-all ./documents/processed-documents

2019-02-11T08:38:36.767Z info: All documents in ./documents/processed-documents is verified
```

## Verifying Single Signed Document
sign
This command verifies that the document (and all it's evidence) is valid and is part of the document batch. However, it does not verify that the batch's merkle root is stored on the blockchain. User will need to verify that the document has indeed been issued by checking with the issuer's smart contract.

```bash
./index.js verify <PathToDocument>
```

Example:

```bash
./index.js verify ./documents/processed-documents/urn:uuid:08b1f10a-6bf0-46c8-bbfd-64750b0d73ef.json

2019-02-11T08:41:17.301Z info: Document's signature is valid!
2019-02-11T08:41:17.302Z warn: Warning: Please verify this document on the blockchain with the issuer's document store.
```

## Document privacy filter

This allows document holders to generate valid documents which hides certain evidences. Useful for hiding grades lol.

```bash
./index.js filter <inputDocumentPath> <outputDocumentPath> [filters...]
```

Example:

```bash
./index.js filter signed/example1.json signed/example1.out.json transcript.0.grade transcript.1.grade

2019-02-11T08:43:50.643Z info: Obfuscated document saved to: signed/example1.out.json
```

## Version

```
./index.js --version
```

## Test

```
npm run test
```
