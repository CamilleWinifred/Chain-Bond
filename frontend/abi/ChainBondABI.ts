
/* Auto-generated */
export const ChainBondABI = {
  "abi": [
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "friend",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "allowed",
          "type": "bool"
        }
      ],
      "name": "ConsentUpdated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint32",
          "name": "publicScore",
          "type": "uint32"
        }
      ],
      "name": "Rated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint32",
          "name": "publicScore",
          "type": "uint32"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "cid",
          "type": "string"
        }
      ],
      "name": "RatedWithCid",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "friend",
          "type": "address"
        }
      ],
      "name": "getDecryptConsent",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "friend",
          "type": "address"
        }
      ],
      "name": "getPairLastCid",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "friend",
          "type": "address"
        }
      ],
      "name": "getPairPublicStats",
      "outputs": [
        {
          "internalType": "uint32",
          "name": "sum",
          "type": "uint32"
        },
        {
          "internalType": "uint32",
          "name": "count",
          "type": "uint32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "friend",
          "type": "address"
        }
      ],
      "name": "getPairStats",
      "outputs": [
        {
          "internalType": "euint32",
          "name": "sum",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "count",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "protocolId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "friend",
          "type": "address"
        },
        {
          "internalType": "externalEuint32",
          "name": "encryptedScore",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "inputProof",
          "type": "bytes"
        }
      ],
      "name": "rate",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "friend",
          "type": "address"
        },
        {
          "internalType": "externalEuint32",
          "name": "encryptedScore",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "inputProof",
          "type": "bytes"
        },
        {
          "internalType": "string",
          "name": "cid",
          "type": "string"
        },
        {
          "internalType": "uint32",
          "name": "publicScore",
          "type": "uint32"
        }
      ],
      "name": "rateWithCid",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "friend",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "allowed",
          "type": "bool"
        }
      ],
      "name": "setDecryptConsent",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]
} as const;
