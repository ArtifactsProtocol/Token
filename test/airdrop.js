const hre = require('hardhat')
const { expect, assert } = require('chai')
const { ethers } = require('hardhat')

describe('Airdrop contract', function () {
  let Token
  let token
  let Airdrop
  let airdrop
  let owner
  let addrs
  let proof
  let root

  before(async function () {
    ;[owner, ...addrs] = await ethers.getSigners()
    Token = await hre.ethers.getContractFactory('Token')
    token = await Token.deploy()

    Airdrop = await hre.ethers.getContractFactory('Airdrop')
    airdrop = await Airdrop.deploy(token.address)

    await token.approve(airdrop.address, ethers.constants.MaxUint256)
  })

  describe('Check token info', function () {
    it('name', async function () {
      expect(await token.name()).to.be.equal('Artifacts Protocol Token')
    })

    it('symbol', async function () {
      expect(await token.symbol()).to.be.equal('ARTIFACT')
    })

    it('totalSupply', async function () {
      expect((await token.totalSupply()).toString()).to.be.equal(
        '1000000000000000000000000000',
      )
    })
  })

  describe('Set root and check exists', function () {
    it('Set root', async function () {
      tree = calcMerkleTree(addrs[0].address, 1, 10)
      proof = tree.proof
      root = tree.root

      await airdrop.setRoot(root, ethers.constants.MaxUint256)
      expect(await airdrop.checkProof(proof, addrs[0].address, 1)).to.be.true
    })

    it('withdraw more than your quota', async function () {
      expect(await airdrop.checkProof(proof, addrs[0].address, 2)).to.be.false
      let _err
      try {
        await airdrop.getTokensByMerkleProof(proof, addrs[0].address, 2)
      } catch (err) {
        _err = err
      }
      expect(_err).to.be.not.undefined
    })

    it('withdraw', async function () {
      expect((await token.balanceOf(addrs[0].address)).toNumber()).to.be.equal(
        0,
      )
      expect(await airdrop.checkProof(proof, addrs[0].address, 1)).to.be.true
      await airdrop.getTokensByMerkleProof(proof, addrs[0].address, 1)
      expect((await token.balanceOf(addrs[0].address)).toNumber()).to.be.equal(
        1,
      )
    })

    it('dup withdraw', async function () {
      expect(await airdrop.checkProof(proof, addrs[0].address, 1)).to.be.false
      let _err
      try {
        await airdrop.getTokensByMerkleProof(proof, addrs[0].address, 1)
      } catch (err) {
        _err = err
      }
      expect(_err).to.be.not.undefined
    })
  })
})

function calcMerkleTree(address, amont, level) {
  const leaf = ethers.utils.keccak256(
    ethers.utils.solidityPack(['address', 'uint256'], [address, amont]),
  )
  const proof = []
  let h = leaf
  for (let i = 0; i < level; i++) {
    const rand = ethers.utils.hexlify(ethers.utils.randomBytes(32))
    proof.push(rand)
    const branch = []
    if (ethers.BigNumber.from(rand).gte(ethers.BigNumber.from(h))) {
      branch.push(h)
      branch.push(rand)
    } else {
      branch.push(rand)
      branch.push(h)
    }
    h = ethers.utils.keccak256(
      ethers.utils.solidityPack(['bytes32', 'bytes32'], branch),
    )
  }
  return { proof, root: h }
}
