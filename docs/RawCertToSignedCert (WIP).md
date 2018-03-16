Raw Cert -> Signed Cert

1. Remove keys (cert.signature, cert.badge.evidence, cert.badge.privateEvidence)
2. Flatten ([Apply canonicalization algorithm]('./CertCanonicalization.md'))
3. Apply [merkle tree algorithm]('./MerkleTreeGeneration.md')
4. Append proof (TBA: proof format)