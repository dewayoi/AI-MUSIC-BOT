const queue = [];

function addToQueue(job) {
  queue.push(job);
}

function getQueue() {
  return queue;
}

module.exports = {
  addToQueue,
  getQueue,
};