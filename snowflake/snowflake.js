let BigInteger = require('jsbn').BigInteger;
// let twepoch = 1288834974657;
let twepoch = 1509621297000;
let workerIdBits = 5;
let dataCenterIdBits = 5;
let maxWrokerId = -1 ^ (-1 << workerIdBits);
let maxDataCenterId = -1 ^ (-1 << dataCenterIdBits);
let sequenceBits = 12;
let workerIdShift = sequenceBits;
let dataCenterIdShift = sequenceBits + workerIdBits;
let timestampLeftShift = sequenceBits + workerIdBits + dataCenterIdBits;
let sequenceMask = -1 ^ (-1 << sequenceBits);
let lastTimestamp = -1;

//设置默认值,从环境变量取
let c_workerId = 1;
let c_dataCenterId = 1;
let c_sequence = 0;

class SnowflakeClass {

  init(config) {
    if (!isNaN(config.worker_id)) {
      c_workerId = Number(config.worker_id);
    }
    if (!isNaN(config.data_center_id)) {
      c_dataCenterId = Number(config.data_center_id);
    }
    if (!isNaN(config.sequence)) {
      c_sequence = Number(config.sequence);
    }
    if (c_workerId > maxWrokerId || c_workerId < 0) {
      throw new Error('config.worker_id must max than 0 and small than maxWrokerId-[' +
        maxWrokerId + ']');
    }
    if (c_dataCenterId > maxDataCenterId || c_dataCenterId < 0) {
      throw new Error('config.data_center_id must max than 0 and small than maxDataCenterId-[' +
        maxDataCenterId + ']');
    }
  };

  nextId(workerId, dataCenterId, sequence) {
    if (!isNaN(workerId)) {
      workerId = Number(workerId);
    }
    else {
      workerId = c_workerId;
    }
    if (!isNaN(dataCenterId)) {
      dataCenterId = Number(dataCenterId);
    } else {
      dataCenterId = c_dataCenterId;
    }
    if (!isNaN(sequence)) {
      sequence = Number(sequence);
    } else {
      sequence = c_sequence;
    }

    if (workerId > maxWrokerId || workerId < 0) {
      throw new Error('workerId must max than 0 and small than maxWrokerId-[' +
        maxWrokerId + ']');
    }
    if (dataCenterId > maxDataCenterId || dataCenterId < 0) {
      throw new Error('dataCenterId must max than 0 and small than maxDataCenterId-[' +
        maxDataCenterId + ']');
    }

    let timestamp = timeGen();
    if (lastTimestamp === timestamp) {
      sequence = (sequence + 1) & sequenceMask;
      if (sequence === 0) {
        timestamp = tilNextMillis(lastTimestamp);
      }
    } else {
      sequence = 0;
    }
    if (timestamp < lastTimestamp) {
      throw new Error('Clock moved backwards. Refusing to generate id for ' +
        (lastTimestamp - timestamp));
    }

    lastTimestamp = timestamp;
    let shiftNum = (dataCenterId << dataCenterIdShift) |
      (workerId << workerIdShift) | sequence;
    let nfirst = new BigInteger(String(timestamp - twepoch), 10);
    nfirst = nfirst.shiftLeft(timestampLeftShift);
    let nnextId = nfirst.or(new BigInteger(String(shiftNum), 10));
    let nextId = nnextId.toRadix(10);
    return String(nextId);
  }
}


function tilNextMillis(lastTimestamp) {
  let timestamp = timeGen();
  while (timestamp <= lastTimestamp) {
    timestamp = timeGen();
  }
  return timestamp;
}

function timeGen() {
  let dt = new Date();
  return dt.getTime();
}

module.exports = Snowflake = new SnowflakeClass();
