const ethers = require('ethers');
const provider = new ethers.providers.JsonRpcProvider(process.env.URL);
const privateKey = process.env.PRIVATE_KEY;
const wallet = new ethers.Wallet(privateKey, provider);

const encode = (type, value) => {
  let retVal;
  switch (type) {
    case 'bytes32':
      retVal = ethers.utils.formatBytes32String(value);
      break;
    default:
      retVal = ethers.utils.defaultAbiCoder.encode([type], [value]);
      break;
  }
  return retVal.slice(2);
};

const createRequest = (input, callback) => {
  const externalAddress = input.data.exAddr || '';
  const functionId = input.data.funcId || '';
  const dataType = input.data.dataType || 'uint256';
  // Prioritize data coming from a previous adapter (result),
  // but allow dataToSend to be used if specified
  const dataToSend = input.data.result || input.data.dataToSend || '';

  // Ensure we use only 4 bytes for the functionId
  const transactionData = functionId.substring(0, 10) + encode(dataType, dataToSend);

  const transaction = {
    to: externalAddress,
    data: transactionData
  };

  let sendTransactionPromise = wallet.sendTransaction(transaction);

  sendTransactionPromise.then((tx) => {
    callback(200, {
      jobRunID: input.id,
      data: tx,
      statusCode: 200
    });
  }).catch((err) => {
    console.log('Error!', err)
    callback(400, {
      jobRunID: input.id,
      status: 'errored',
      error: err,
      statusCode: 400
    });
  });
};

exports.gcpservice = (req, res) => {
  createRequest(JSON.parse(req.body), (statusCode, data) => {
    res.status(statusCode).send(data);
  });
};

exports.handler = (event, context, callback) => {
  createRequest(JSON.parse(event), (statusCode, data) => {
    callback(null, data);
  });
}

module.exports.createRequest = createRequest;
