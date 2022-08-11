
const { ethers } = require('hardhat');
async function print_params() {
  const [deployer, proxyAdmin, relayer] = await ethers.getSigners();
  let nonce = await deployer.getTransactionCount();
  const poolFactory = await ethers.getContractFactory("Pool");
  let oldPool = poolFactory.attach("0xC89Ce4735882C9F0f0FE26686c53074E09B0D550")
  const operatorManager = await oldPool.operatorManager()
  console.log("operatorManager", operatorManager)
  const voucherToken = await oldPool.voucher_token()

  // let poolId = await oldPool.pool_id()

  // !!!!!! Temporary  !!!!!
  const  poolId = nonce
  console.log("pool id will be: ", poolId);
  /////

  const denominator = await oldPool.denominator()

  const token = await oldPool.token()

  const initialRoot = "11469701942666298368112882412133877458305516134926649826543144744382391691533";
  const TransferVerifierFactory = await ethers.getContractFactory("TransferVerifier");

  const transferVerifier = await TransferVerifierFactory.deploy()

  const TreeUpdateVerifierFactory = await ethers.getContractFactory("TreeUpdateVerifier");

  const treeUpdateVerifier = await TreeUpdateVerifierFactory.deploy()


  const upgradedPool = await poolFactory.deploy(poolId,
    token,
    voucherToken,
    denominator,  //_denominator
    denominator, //_energy_denominator
    denominator,//_native_denominator
    transferVerifier.address,
    treeUpdateVerifier.address,
    operatorManager,
    initialRoot,
    { nonce: nonce + 2 });

  console.log("upgradedPool = ", upgradedPool.address)

  const ZeroPoolProxy = await ethers.getContractFactory("ZeroPoolProxy");

  const proxy = ZeroPoolProxy.attach("0xC89Ce4735882C9F0f0FE26686c53074E09B0D550")

  await proxy.connect(proxyAdmin).upgradeTo(upgradedPool.address)

  console.log("new pool id ", await oldPool.connect(deployer).poolId())

}


print_params().then(() => console.log("Done"))
  .catch((err) => console.error("err: ", err))
