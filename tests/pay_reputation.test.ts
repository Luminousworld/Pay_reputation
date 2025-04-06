import { assertEquals, callReadOnlyFunction, makeContractCall, clarify, chain, getTransactionResult, getClarinet } from "clarinet";

describe("Reputation System Tests", () => {
  let admin;
  let payer;
  let payee;

  beforeAll(() => {
    // Set up accounts
    admin = chain.accounts[0];  // Admin (contract owner)
    payer = chain.accounts[1];  // Payer
    payee = chain.accounts[2];  // Payee
  });

  it("Should record a successful payment and update reputation", async () => {
    const paymentAmount = 100;
    
    // Admin deploys the contract and records a successful payment
    const result = await makeContractCall({
      contractAddress: "contract",
      contractName: "reputation-system",
      functionName: "record-successful-payment",
      functionArgs: [payee.address, paymentAmount],
      sender: payer.address
    });

    assertEquals(result, { "ok": true });

    // Check that the payment record is updated
    const paymentRecord = await callReadOnlyFunction({
      contractAddress: "contract",
      contractName: "reputation-system",
      functionName: "get-payment-record",
      functionArgs: [payer.address, payee.address],
      sender: payer.address
    });

    assertEquals(paymentRecord, {
      total-paid: paymentAmount,
      successful-payments: 1,
      failed-payments: 0
    });

    // Check that the reputation score is updated for the payer
    const reputation = await callReadOnlyFunction({
      contractAddress: "contract",
      contractName: "reputation-system",
      functionName: "get-reputation",
      functionArgs: [payer.address],
      sender: payer.address
    });

    assertEquals(reputation, {
      score: 10,  // As successful payments should add 10 points
      total-transactions: 1
    });
  });

  it("Should penalize a payer and decrease their reputation", async () => {
    const penalty = 5;

    // Admin penalizes the payer
    const result = await makeContractCall({
      contractAddress: "contract",
      contractName: "reputation-system",
      functionName: "penalize-payer",
      functionArgs: [payer.address, penalty],
      sender: admin.address
    });

    assertEquals(result, { "ok": true });

    // Check that the reputation score is decreased for the payer
    const reputation = await callReadOnlyFunction({
      contractAddress: "contract",
      contractName: "reputation-system",
      functionName: "get-reputation",
      functionArgs: [payer.address],
      sender: payer.address
    });

    assertEquals(reputation, {
      score: 5,  // After penalty deduction (10 - 5)
      total-transactions: 1
    });
  });

  it("Should fail when non-admin tries to penalize a payer", async () => {
    const penalty = 5;

    // Non-admin tries to penalize the payer
    const result = await makeContractCall({
      contractAddress: "contract",
      contractName: "reputation-system",
      functionName: "penalize-payer",
      functionArgs: [payer.address, penalty],
      sender: payer.address
    });

    assertEquals(result, { "err": { "string": "u100" } });
  });

  it("Should return the correct payment record", async () => {
    // Check payment record for the specific payer and payee
    const paymentRecord = await callReadOnlyFunction({
      contractAddress: "contract",
      contractName: "reputation-system",
      functionName: "get-payment-record",
      functionArgs: [payer.address, payee.address],
      sender: payer.address
    });

    assertEquals(paymentRecord, {
      total-paid: 100,
      successful-payments: 1,
      failed-payments: 0
    });
  });

  it("Should return the correct reputation score", async () => {
    // Check reputation for the specific payer
    const reputation = await callReadOnlyFunction({
      contractAddress: "contract",
      contractName: "reputation-system",
      functionName: "get-reputation",
      functionArgs: [payer.address],
      sender: payer.address
    });

    assertEquals(reputation, {
      score: 5,  // After penalty deduction (10 - 5)
      total-transactions: 1
    });
  });
});