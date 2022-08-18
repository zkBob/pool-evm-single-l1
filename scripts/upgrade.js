
const { ethers, BigNumber } = require('hardhat');
async function print_params() {
  const [deployer, proxyAdmin, relayer] = await ethers.getSigners();
  let nonce = await deployer.getTransactionCount();
  const poolFactory = await ethers.getContractFactory("Pool");
  const pool_proxy_address="0xC89Ce4735882C9F0f0FE26686c53074E09B0D550";
  // const pool_proxy_address="0xDb56f2e9369E0D7bD191099125a3f6C370F8ed15";
  let oldPool = poolFactory.attach(pool_proxy_address)
  const operatorManager = await oldPool.operatorManager()
  console.log("operatorManager", operatorManager)
  const voucherToken = await oldPool.voucher_token()
  console.log("voucherToken", voucherToken)

  let poolId = 0

  const denominator = await oldPool.denominator()
  console.log("denominator", denominator)
  const token = await oldPool.token()
  console.log("token", token)
  const initialRoot = "11469701942666298368112882412133877458305516134926649826543144744382391691533";
  // const TransferVerifierFactory = await ethers.getContractFactory("TransferVerifier");

  // const transferVerifier = await TransferVerifierFactory.deploy()

  // const TreeUpdateVerifierFactory = await ethers.getContractFactory("TreeUpdateVerifier");

  const treeUpdateVerifier = await oldPool.tree_verifier()
  const transferVerifier = await oldPool.transfer_verifier()


  const upgradedPool = await poolFactory.deploy(poolId,
    token,
    voucherToken,
    denominator,  //_denominator
    denominator, //_energy_denominator
    denominator,//_native_denominator
    transferVerifier,
    treeUpdateVerifier,
    operatorManager,
    initialRoot,
    "3000000000000000000",
    { nonce: nonce  });

  console.log("upgradedPool = ", upgradedPool.address)

  const ZeroPoolProxy = await ethers.getContractFactory("ZeroPoolProxy");

  const proxy = ZeroPoolProxy.attach(pool_proxy_address)

  await proxy.connect(proxyAdmin).upgradeTo(upgradedPool.address)

  const daily_quota = await upgradedPool.daily_quota()
  console.log("daily_quota ", daily_quota)

}


print_params().then(() => console.log("Done"))
  .catch((err) => console.error("err: ", err))