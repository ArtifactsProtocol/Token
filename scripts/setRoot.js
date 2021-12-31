#!/usr/bin/env -S npx hardhat run --network rinkeby
const hre = require('hardhat')
const fs = require('fs')
const path = require('path')

const address = '0x9a5450771c8D8CD28fb41308d406f8e814e8B4E0'
const deadline = Date.parse('2022-03-01T00:00:00Z')
const list = [
  { amount: '100', address: '0xe95611F32aC85c0Fb8544e167505950F793bAeCE' },
  { amount: '100', address: '0x0000000000000000000000000000000000000000' },
  { amount: '100', address: '0x0000000000000000000000000000000000000001' },
  { amount: '100', address: '0x0000000000000000000000000000000000000002' },
  { amount: '100', address: '0x0000000000000000000000000000000000000003' },
  { amount: '100', address: '0x0000000000000000000000000000000000000004' },
  { amount: '100', address: '0x0000000000000000000000000000000000000005' },
  { amount: '100', address: '0x0000000000000000000000000000000000000006' },
  { amount: '100', address: '0x0000000000000000000000000000000000000007' },
  { amount: '100', address: '0x0000000000000000000000000000000000000008' },
  { amount: '100', address: '0x0000000000000000000000000000000000000009' },
  { amount: '100', address: '0x000000000000000000000000000000000000000a' },
  { amount: '100', address: '0x000000000000000000000000000000000000000b' },
  { amount: '100', address: '0x000000000000000000000000000000000000000c' },
  { amount: '100', address: '0x000000000000000000000000000000000000000d' },
  { amount: '100', address: '0x000000000000000000000000000000000000000e' },
  { amount: '100', address: '0x000000000000000000000000000000000000000f' },
]

async function main() {
  const Token = await hre.ethers.getContractFactory('Token')
  const token = await Token.attach(address)
  let nest = 0
  while (Math.pow(2, nest) < list.length) {
    nest++
  }
  let cur = []
  for (const item of list) {
    const hash = ethers.utils.keccak256(
      ethers.utils.solidityPack(
        ['address', 'uint256'],
        [item.address, ethers.BigNumber.from(item.amount)],
      ),
    )
    item.proof = []
    cur.push({ hash, children: [item] })
  }
  for (let i = 0; i < nest; i++) {
    const next = []
    const parentCount = Math.pow(2, nest - i - 1)
    for (let j = 0; j < parentCount; j++) {
      const child1 = cur[j * 2]
      const child2 = cur[j * 2 + 1]
      if (child1 != null && child2 != null) {
        let branch
        if (
          ethers.BigNumber.from(child1.hash).lte(
            ethers.BigNumber.from(child2.hash),
          )
        ) {
          branch = [child1.hash, child2.hash]
        } else {
          branch = [child2.hash, child1.hash]
        }
        const parent = ethers.utils.keccak256(
          ethers.utils.solidityPack(['bytes32', 'bytes32'], branch),
        )
        child1.children.forEach((item) => item.proof.push(child2.hash))
        child2.children.forEach((item) => item.proof.push(child1.hash))
        next.push({
          hash: parent,
          children: [...child1.children, ...child2.children],
        })
      }
      if (child1 != null && child2 == null) {
        next.push(child1)
      }
    }
    cur = next
  }
  console.log('root:', cur[0].hash)
  const allocationMap = {}
  for (const child of cur[0].children) {
    allocationMap[child.address] = { amount: child.amount, proof: child.proof }
  }
  fs.writeFileSync(
    path.join(__dirname, '../allocation.json'),
    JSON.stringify(allocationMap, null, 2),
  )
  const tx = await token.setRoot(cur[0].hash, Math.floor(deadline / 1000))
  console.log('setRoot:', tx.hash)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
