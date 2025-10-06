import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("ChainBond", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: 1,
  });
};

export default func;
func.tags = ["ChainBond"];


