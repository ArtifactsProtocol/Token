// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract Token is ERC20 {
    event AirdropTransfer(
        address indexed from,
        address indexed to,
        uint256 value
    );

    struct merkleRoot {
        bool exists;
        address from;
        uint256 deadline;
    }
    mapping(bytes32 => merkleRoot) merkleRoots;
    mapping(bytes32 => mapping(address => bool)) spent;

    constructor() ERC20('Artifacts Protocol Token', 'ARTIFACT') {
        super._mint(_msgSender(), 1000000000 * (10**super.decimals()));
    }

    function setRoot(bytes32 _root, uint256 deadline) public {
        merkleRoots[_root] = merkleRoot(true, _msgSender(), deadline);
    }

    function getLeaf(address _target, uint256 _amount)
        internal
        pure
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(_target, _amount));
    }

    function calcRoot(bytes32[] memory _proof, bytes32 _hash)
        internal
        pure
        returns (bytes32)
    {
        bytes32 el;
        bytes32 h = _hash;

        for (uint256 i = 0; i <= _proof.length - 1; i += 1) {
            el = _proof[i];
            if (h < el) {
                h = keccak256(abi.encodePacked(h, el));
            } else {
                h = keccak256(abi.encodePacked(el, h));
            }
        }

        return h;
    }

    function checkProof(
        bytes32[] memory _proof,
        address _target,
        uint256 _amount
    ) public view returns (bool) {
        bytes32 root = calcRoot(_proof, getLeaf(_target, _amount));
        return
            !spent[root][_target] &&
            merkleRoots[root].exists &&
            block.timestamp < merkleRoots[root].deadline;
    }

    function getTokensByMerkleProof(
        bytes32[] memory _proof,
        address _target,
        uint256 _amount
    ) public {
        bytes32 root = calcRoot(_proof, getLeaf(_target, _amount));
        require(!spent[root][_target], 'Target already spent');
        merkleRoot memory rootInfo = merkleRoots[root];
        require(
            rootInfo.exists && block.timestamp < rootInfo.deadline,
            'Invalid proof'
        );
        super._transfer(rootInfo.from, _target, _amount);
        spent[root][_target] = true;
        emit AirdropTransfer(rootInfo.from, _target, _amount);
    }
}
