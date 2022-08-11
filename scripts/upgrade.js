
const { ethers } = require('hardhat');
async function print_params() {

  const poolFactory = await ethers.getContractFactory("Pool");
  const oldPool = poolFactory.attach("0xC89Ce4735882C9F0f0FE26686c53074E09B0D550")
  const operatorManager = await oldPool.operatorManager()
  const voucherToken = await oldPool.voucher_token()
  const poolId = await oldPool.pool_id()
  const denominator = await oldPool.denominator()
  const token = await oldPool.token()

  const initialRoot = "11469701942666298368112882412133877458305516134926649826543144744382391691533";
  const TransferVerifierFactory = await ethers.getContractFactory("TransferVerifier");

  const transferVerifier = await TransferVerifierFactory.deploy()

  const TreeUpdateVerifierFactory = await ethers.getContractFactory("TreeVerifier");

  const treeUpdateVerifier = await TreeUpdateVerifierFactory.deploy("TreeUpdateVerifier")

  const upgraded = await Pool.deploy(poolId,
    token.address,
    voucherToken.address,
    denominator,  //_denominator
    denominator, //_energy_denominator
    denominator,//_native_denominator
    transferVerifier.address,
    treeUpdateVerifier.address,
    operatorManager.address,
    initialRoot,
    { nonce: nonce++ });

    console.log("upgraded = ", upgraded)

}


print_params().then(() => console.log("Done"))
  .catch((err) => console.error("err: ", err))
