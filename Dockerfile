FROM lok52/verifier:latest as verifier

FROM node:16

WORKDIR /app

COPY ./package*.json ./

RUN npm install

COPY ./ ./

COPY --from=verifier /app/TreeUpdateVerifier.sol /app/contracts/
COPY --from=verifier /app/TransferVerifier.sol /app/contracts/

RUN npx hardhat compile

ENV MOCK_TREE_VERIFIER=false
ENV MOCK_TX_VERIFIER=false

ENV NETWORK=${NETWORK:-docker_ganache}
CMD npx hardhat run --network $NETWORK scripts/deploy-task.js