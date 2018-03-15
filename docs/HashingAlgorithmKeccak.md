# Hashing algorithm

The hashing algorithm implementation used for deriving the Merkle tree is the one used in the Ethereum blockchain hash (keccak-256)

The following examples can be used to check if your hash implementation is behaving correctly.

(The byte array outputs have been formatted to ascii for easier viewing)

```Javascript
const { sha3 } = require("ethereumjs-util")

sha3('👽').hexSlice()
>'462a1d6391f7ea5916874504f3b5fc8cd43626f6bbabc8a22fe4312dc1585362'
sha3('王明').hexSlice()
>'3e8e8a2a8016d5e6541ec82a39683fa707872cbc4dfe1ab61ca2cb06411f6a2f'
sha3('a').hexSlice()
>'3ac225168df54212a25c1c01fd35bebfea408fdac2e31ddd6f80a4bbf9a5f1cb'

```

```Python
from eth_utils.curried import keccak
import binascii

binascii.hexlify(keccak(text='👽'))
>>> b'462a1d6391f7ea5916874504f3b5fc8cd43626f6bbabc8a22fe4312dc1585362'
binascii.hexlify(keccak(text='王明'))
>>> b'3e8e8a2a8016d5e6541ec82a39683fa707872cbc4dfe1ab61ca2cb06411f6a2f'
binascii.hexlify(keccak(text='a'))
>>> b'3ac225168df54212a25c1c01fd35bebfea408fdac2e31ddd6f80a4bbf9a5f1cbo
```