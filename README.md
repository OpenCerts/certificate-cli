# Certificate CLI tool

## Setup

```bash
npm install
```

## Batching Certificates

This command process all certificates in the input directory and issue all of them in a single
batch. It will then add the signature to the individual certificates.

```bash
./index.js batch <PathToUnsignedCertificates> <PathToSignedCertificates>
```

Example:

```bash
./index.js batch ./certificates/raw-certificates/ ./certificates/processed-certificates/

2019-02-11T08:37:44.848Z info: Batch Certificate Root: 0xf51030c5751a646284c898cff0f9d833c64a50d6f307b61f2c96c3c838b13bfc
```

## Verifying All Signed Certificate in a Directory

This command verifies that the certificate (and all it's evidence) is valid and is part of the certificate batch. However, it does not verify that the batch's merkle root is stored on the blockchain. User will need to verify that the certificate has indeed been issued by checking with the issuer's smart contract.

```bash
./index.js verify-all <PathToCertificate>
```

Example:

```bash
./index.js verify-all ./certificates/processed-certificates

2019-02-11T08:38:36.767Z info: All certificates in ./certificates/processed-certificates is verified
```

## Verifying Single Signed Certificate
sign
This command verifies that the certificate (and all it's evidence) is valid and is part of the certificate batch. However, it does not verify that the batch's merkle root is stored on the blockchain. User will need to verify that the certificate has indeed been issued by checking with the issuer's smart contract.

```bash
./index.js verify <PathToCertificate>
```

Example:

```bash
./index.js verify ./certificates/processed-certificates/urn:uuid:08b1f10a-6bf0-46c8-bbfd-64750b0d73ef.json

2019-02-11T08:41:17.301Z info: Certificate's signature is valid!
2019-02-11T08:41:17.302Z warn: Warning: Please verify this certificate on the blockchain with the issuer's certificate store.
```

## Certificate privacy filter

This allows certificate holders to generate valid certificates which hides certain evidences. Useful for hiding grades lol.

```bash
./index.js filter <inputCertificatePath> <outputCertificatePath> [filters...]
```

Example:

```bash
./index.js filter signed/example1.json signed/example1.out.json transcript.0.grade transcript.1.grade

2019-02-11T08:43:50.643Z info: Obfuscated certificate saved to: signed/example1.out.json
```

## Version

```
./index.js --version
```

## Test

```
npm run test
```
