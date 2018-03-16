## What is open certificate?

Open certificate is an extension of open badge to allow institutes to issue certificates to students. These certificates can then be verified on the ethereum network for authenticity. With the tools provided, we lower the barrier of entry for smaller institutes as there will be no need to maintain any IT infrastructure. 


##What is in a certificate?

A certificate issued under the open certificate standard is simply a [json](https://www.json.org/) file. The file will have to follow the schema set forth by the [open badge schema](https://openbadgespec.org) and [open certificate extension](https://govtechsg.github.io/certificate-schema/).

On top of certificate data, each certificate will contain:

- Recipient's Identity
- Verification Signature
- Verification Contract Address


### Recipient's Identity

Identity of the recipient may be expressed in various methods proposed by open badge schema. On top of that, open certificate include support for [decentralised identifiers (DID)](https://w3c-ccg.github.io/did-spec/). 

### Verification Signature

The verification signature of the certificate ensures that the certificate has not been tampered with and has been issued by the issuer. 

The `target hash` in the signature is a digest of the entire certificate. Any change to the certificate data will result in a different `target hash`, leading to a different `merkle root`. 

The `proof` provides a cryptographic proof that the certificate exist in a batch of certificates issued by the issuer. 

The `merkle root` of the certificate is then checked against the certificate store smart contract to verify that the certificate has been issued and was not revoked. 

### Verification Contract Address

The contract address is the address of the certificate store smart contract managed by the issuer. The `merkle root` of the certificate is checked against the contract to ensure it has been issued and not been revoked. 

The contract address must be known to the verifier through other methods to ensure that the contract was issued by the right entity. The team is exploring different methods to allow verifiers to do so either via a centralised registrar or a decentralised web of trust. The current implementation is via a file check. 

## Comparison with paper certificate

### Pro
- Easier to issue/recover/verify
- Able to be duplicated & stored in multiple place
- Protected against tampering/damage/ageing

### Con
- Easier to misplace

## Verification Process

1. Target hash is valid
2. Certificate is issued on the institute smart contract
3. Certificate has not been revoked on the institute smart contract
4. Smart contract address is a verified issuer

## Workflow

### Issuer

1. Prepare certificates in accordance to schema
2. Batch certificate using CLI tool (or web UI in future)
3. Issue certificate on the certificate store
4. Send individual signed certificates to recipient

### Student

1. Receives certificate from institute
2. Censor field which they would like to hide on Web UI (if applicable)
3. Download new version of censored certificate (if applicable)
4. Send the certificate to verifier

### Verifier

1. Receives certificate from student
2. Upload file on Web UI to validate
3. Check institute's contract address (if warning is shown for unknown issuer)

## Secured Issuing Process

The web UI includes support for hardware wallet [ledger nano](https://www.ledgerwallet.com/products/ledger-nano-s). 

To allow open certificate to conform to existing policies of issuing/printing certificates, we propose the use of hardware wallet. 

Hardware wallet protects the private key of the ethereum wallet by never allowing the key to leave the device. Instead, transactions are sent onto the device to be signed. Even on an infected host machine, the private key for signing the transaction is safe.

### Multiple key holders

As the hardware wallet is protected by a passphrase, we also recommend separation of duties by allowing one party to hold on the physical token (and the first 12 mnemonic word) and another party to have possession of the passphrase (and the next 12 mnemonic word).

### Additional protection

To increase the degree of separation of duties, a third party can make use of the [additional passphrase](https://support.ledgerwallet.com/hc/en-us/articles/360000783134-How-to-set-up-and-or-recover-a-hidden-passphrase-and-alternate-PIN-on-your-Ledger-Nano-S-). In this setup, the wallet is accessible only when the physical device, original pin and additional passphrase is present. 


## Outstanding Problems

### Public key infrastructure (PKI)

Current implementation of open certificate has deferred the need for PKI. It is currently using a central registry service to store verified identity of various institutes. 

We suggest to explore options such to mimic either the [Certificate Authorities (CAs)](https://en.wikipedia.org/wiki/Certificate_authority) or [Web-of-trust model](https://en.wikipedia.org/wiki/Web_of_trust). 

#### Certificate Authority

This model will require verifier applications (such as Web UI) to have built in root CAs who will attest to the identity of education institutes. 

A logical implementation of this will to have each country's Ministry of Education (or the equivalent of it) run a root CA which will provide a registry of all it's approved education institutes to issue certificates. 

#### Web of Trust

This model require every issuer (and/or recipients) to build a network of 'trust'. When the network is connected, it will provide a value of trust from any issuer to any issuer. 

More work has to be done to investigate the use of this model for trusted issuers. 

### Certificate wallet services

Currently, certificates can be stored on physical device (ie thumbdrive), cloud storage (ie google drive) or on individual issuer's student portal. These platforms do not provide a user friendly way to view, send or verify certificates. 

A wallet mobile application can be developed for users to store their certificate (either online or offline). Some key functions of the wallet are:

- Storing of certificate
- Viewing of certificate
- Filtering of certificate data
- Sending of certificate to others

### Mass adoption

Adoption of this certificate standard for education institutes around the world may be a challenge. 

#### Cultural Reasons

It may be hard for digital certificates to replace paper certificate due to symbolism reasons. Digital certificates such as open certificate would be impractical to be printed out and awarded to recipient in an award ceremony or be hung on the wall.

#### Network Value

In addition, the [value of the open certificate standard is proportional to the number of participating institutes](https://en.wikipedia.org/wiki/Metcalfe%27s_law). Non-participating institutes may not have incentives to join if there are too few institutes on board.

It may be a challenge at the start as verifiers may not accept digital certificates.

### Identity consistency

Currently there are no universally agreed method to uniquely identify an individual. As such, it will be hard to mathematically proof the association of a certificate with a person. 

In addition, depending on the country in question, they may not even have a system for national identity in place, further exacerbating the problem. 

We propose to use of Decentralised ID to identify individuals, where identity resolvers could be the individual nations. 
