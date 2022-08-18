const { ethers } = require('hardhat');


async function main() {

    const pool_proxy_address = "0x4cFB3F70BF6a80397C2e634e5bDd85BC0bb189EE";

    const pool_impl_address = "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550";

    const Pool = await ethers.getContractFactory("Pool");

    const proxy = Pool.attach(pool_proxy_address)

    let proxy_quota = await proxy.daily_quota();

    const pool = Pool.attach(pool_impl_address)

    let pool_quota = await pool.daily_quota();

    console.log("(proxy_quota, pool_quota)", proxy_quota, pool_quota);
    return "Done"

}


main().then((res) => { console.log(res); })
    .catch(err => console.error(err))