const { ethers } = require('hardhat');


async function main() {

    const pool_proxy_address = "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550";

    const pool_impl_address = "0x0E696947A06550DEf604e82C26fd9E493e576337";

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