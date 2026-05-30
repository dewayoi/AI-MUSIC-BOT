const queue = [];

function addToQueue(job) {
  queue.push(job);
}

function getQueue() {
  return queue;
}

function getQueueLength() {
  return queue.length;
}

module.exports = {
  addToQueue,
  getQueue,
  getQueueLength
};