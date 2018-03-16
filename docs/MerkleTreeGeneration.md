# Merkle Tree Algorithm (arbitrary data)

Inputs: Array of arbitrary data elements

1. Transform array of arbitrary data elements into array of hashes using [hashing algorithm]('./HashingAlgorithmKeccak')
```Javascript
['1', '2'].map(el => sha3(JSON.stringify(el)))

> [ <Buffer 92 61 49 50 95 bf bb 82 de ed b9 7b 2b e9 0d 0f 4c 0d 9a 03 fd d9 0a 9d a6 2c 1b bc c4 5d 7e b2>,
    <Buffer 8f 63 ca 82 e9 97 90 90 79 2c 30 71 44 7f 0c 14 e4 3a 2b 3a 03 fb 67 22 06 6d 6c e0 f9 51 51 ba> ]
```
2. Sort the array of hashes lexicographically
3. Assign the sorted array as the first layer 
4. Generate the parent layers recursively:
  a) For each pair of elements,
  b) Concatenate them with the lexicographically lesser one on the left
  c) Apply the keccak256 algorithm on this concatenated byte array
  d) Repeat until there are 0 or 1 elements left in the layer
  e) If there is 1 element left, promote it to the next layer
  f) Repeat a-e until you arrive at a layer with only 1 element



TODO: insert diagrams for illustration?

# Test Cases

Even element count with no re-ordering needed
```Javascript
elements = [ 'a', 'b', 'c', 'd2' ]

MerkleTree(elements)
> layers:
>    [ [ <Buffer 33 18 8b 87 74 55 59 cf 85 a6 12 66 86 a2 3d 59 f3 32 f6 6f 91 dd 34 28 c0 c5 b9 b9 45 70 c0 0c>,
         <Buffer 66 0c 9a 8d 00 51 d0 7b 1a bd 38 e8 a6 f6 80 76 d9 8f df 94 8a bd 2a 13 e2 87 0f e0 8a 13 43 cc>,
         <Buffer a6 00 68 3b c5 a8 b0 90 cb 15 bb 75 bb 3c 5f a6 a7 dd ff 82 f5 7e a5 e9 69 69 1f 5f 57 5c ef a1>,
         <Buffer a7 8c 7e 6c f2 7e 77 8c e5 5a aa 2a 78 69 43 f1 57 8b c7 6e dc b2 96 ab c9 59 81 c7 86 bb 89 c1> ],
       
       [ <Buffer 60 8b c8 08 af ad 96 f1 bd 9e 86 a9 31 92 61 7d 3c 99 4e d2 6c 10 1d 26 08 74 34 f9 c9 90 a0 f8>,
         <Buffer 81 ba 4c 27 0b ba 1f bf cc de 6e 8d 5c 60 8b 9d f7 97 41 7e 21 bd 05 3f 4b d0 b9 03 bd 76 fd 44> ],
       
       [ <Buffer 87 d5 da e3 07 da 1e 08 1e 35 f3 58 68 91 b9 cc 53 04 b0 51 ed af ea db 12 93 45 4a 93 bc 27 02> ] ]
```

Even element count with reordering

```Javascript
elements = [ 'a', 'b', 'c', 'd' ]

> layers:
>    [ [ <Buffer 2a 32 b6 75 5d 1f 5e 4f 93 27 7c e6 bf 78 c3 51 b4 82 5e 1d 16 46 4a 7b f1 88 2d ce 5b fc 77 59>,
         <Buffer 33 18 8b 87 74 55 59 cf 85 a6 12 66 86 a2 3d 59 f3 32 f6 6f 91 dd 34 28 c0 c5 b9 b9 45 70 c0 0c>,
         <Buffer 66 0c 9a 8d 00 51 d0 7b 1a bd 38 e8 a6 f6 80 76 d9 8f df 94 8a bd 2a 13 e2 87 0f e0 8a 13 43 cc>,
         <Buffer a7 8c 7e 6c f2 7e 77 8c e5 5a aa 2a 78 69 43 f1 57 8b c7 6e dc b2 96 ab c9 59 81 c7 86 bb 89 c1> ],
       
       [ <Buffer 6d bf 31 7e 3f 6d 6a b9 ea d8 62 e7 f9 42 39 69 ab f2 76 c2 b4 a1 37 72 21 76 ba 85 dc 07 ed 3e>,
         <Buffer 6d 56 59 80 9f 50 5c 16 5b e5 83 58 79 73 1d e9 4c 1d 1a 1e 6a d4 02 25 51 d5 13 17 9b 4d 92 c6> ],  // this hash is smaller than the one above
        
       [ <Buffer 47 19 e1 a3 c5 38 e8 f9 f3 5d 9b 52 de 3d c1 ac a1 74 c8 01 0b 65 dd 6c 6d fa 79 a2 b4 6c 77 7a> ] ]
```

Odd element count
```Javascript
elements = [ '1', '2', '3', '4', '5', '6', '7' ]

> layers:
>    [ [ <Buffer 71 49 9b 9d 13 1e d4 e8 31 e3 c3 e1 70 cf 36 3d d6 85 a1 73 ca 23 ee c8 56 51 3e 38 ea 88 be c1>,
         <Buffer 8f 63 ca 82 e9 97 90 90 79 2c 30 71 44 7f 0c 14 e4 3a 2b 3a 03 fb 67 22 06 6d 6c e0 f9 51 51 ba>,
         <Buffer 92 61 49 50 95 bf bb 82 de ed b9 7b 2b e9 0d 0f 4c 0d 9a 03 fd d9 0a 9d a6 2c 1b bc c4 5d 7e b2>,
         <Buffer a4 9a a1 70 cd 06 37 9f 3b e5 8f 0d 7c 2d 70 57 24 da 16 1b f9 56 a7 2f 6e be 54 7d 12 87 b1 fe>,
         <Buffer b4 ce 51 6e f5 93 bc 30 ef ee 67 18 5a 7b eb e1 44 91 96 bb c8 73 94 ac f0 62 df 2c 5e d3 28 97>,
         <Buffer da 25 d2 17 08 53 e8 eb ec cc 10 d3 1c c8 a9 c4 ca 41 d2 d9 2b 59 4f 5c b8 50 d7 ec e6 e1 1a bd>,
         <Buffer de 0d da df 9a 63 d7 99 e3 de 90 8e fa 10 09 21 d1 5c 3d 73 fb 1f 75 fd db 84 be 57 88 ee d4 73> ], // lonely element
       
       [ <Buffer f9 29 f1 26 b3 b3 8d 16 e1 28 e9 8c 2d ee 12 14 8a 06 98 ce 7c c3 0f 81 b8 68 02 ba 0f 17 03 4f>,
         <Buffer 1c fe 14 e7 ba 23 3e 69 d7 69 eb 2c 53 58 34 ea 6c 03 c3 d5 54 38 bd 09 1c 1d 42 ba 23 84 2d f0>,
         <Buffer e2 36 1f dd 1e 6e e4 76 77 79 71 b0 ec d5 ad 67 d7 2a ca 7a f9 07 81 5a 26 dc b7 8a 4f ef 80 34>,
         <Buffer de 0d da df 9a 63 d7 99 e3 de 90 8e fa 10 09 21 d1 5c 3d 73 fb 1f 75 fd db 84 be 57 88 ee d4 73> ], // lonely no more
       
       [ <Buffer 08 55 de 47 8b 9b f3 fe db 31 2b b2 1b 9d bc e7 41 59 ff da da dc 82 2f 90 80 b4 db cd e1 75 75>,
         <Buffer 06 bf 64 40 c9 86 8c 03 7c 2c 52 7b ce f9 a1 3f 47 33 dd 1f ef 42 66 41 09 60 4f 46 a1 8e d7 76> ],
       
       [ <Buffer 6c 68 76 cc 3d d3 86 d2 9b 84 51 e7 0f 56 cc ab 09 e4 f9 33 0c b8 ce 18 68 91 39 59 25 4f 3e a1> ] ]

```


(2^n+1) element count - There will be a lonely element that gets promoted all the way untouched until the penultimate layer
```Javascript
elements = [ 'a', 'b', 'c', 'd', 'e' ]

> layers:
>   [ [ <Buffer 2a 32 b6 75 5d 1f 5e 4f 93 27 7c e6 bf 78 c3 51 b4 82 5e 1d 16 46 4a 7b f1 88 2d ce 5b fc 77 59>,
        <Buffer 33 18 8b 87 74 55 59 cf 85 a6 12 66 86 a2 3d 59 f3 32 f6 6f 91 dd 34 28 c0 c5 b9 b9 45 70 c0 0c>,
        <Buffer 66 0c 9a 8d 00 51 d0 7b 1a bd 38 e8 a6 f6 80 76 d9 8f df 94 8a bd 2a 13 e2 87 0f e0 8a 13 43 cc>,
        <Buffer 90 43 91 ce 58 0e f3 d2 6b 10 4f 33 fd 8e 52 cd 87 33 5c 59 33 c9 37 00 ca 5e 64 c3 17 f9 3c 15>,
        <Buffer a7 8c 7e 6c f2 7e 77 8c e5 5a aa 2a 78 69 43 f1 57 8b c7 6e dc b2 96 ab c9 59 81 c7 86 bb 89 c1> ], // lonely element
      
      [ <Buffer 6d bf 31 7e 3f 6d 6a b9 ea d8 62 e7 f9 42 39 69 ab f2 76 c2 b4 a1 37 72 21 76 ba 85 dc 07 ed 3e>,
        <Buffer 26 e9 b7 eb 02 54 62 26 f2 52 f2 1f 40 0f c8 fb 1b 2a 75 b4 4c 4a bc dd 3f 4a 59 73 bd 8c 47 75>,
        <Buffer a7 8c 7e 6c f2 7e 77 8c e5 5a aa 2a 78 69 43 f1 57 8b c7 6e dc b2 96 ab c9 59 81 c7 86 bb 89 c1> ], // lonely element from above
      
      [ <Buffer 01 7d 37 90 cb bb aa cf b2 25 8d 1d 83 d1 dd ef d5 3b 63 c1 5e 89 0c d4 4e c6 88 e0 06 b7 2f f3>,
        <Buffer a7 8c 7e 6c f2 7e 77 8c e5 5a aa 2a 78 69 43 f1 57 8b c7 6e dc b2 96 ab c9 59 81 c7 86 bb 89 c1> ], // again
      
      [ <Buffer 18 c6 5e 9e e9 ff 2e 0f f8 36 f2 85 32 c5 03 09 27 ba c8 72 8c 32 9b e3 24 ee 9a 47 92 2e 57 2b> ] ]
```