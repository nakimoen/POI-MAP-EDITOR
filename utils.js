Array.prototype.chunk = function (size) {
  return Array.from({ length: Math.ceil(this.length / size) }, (v, i) =>
    this.slice(i * size, i * size + size)
  );
};
const chunk = (arrayData, chunkSize) =>
  Array.from({ length: Math.ceil(arrayData.length / chunkSize) }, (v, i) =>
    arrayData.slice(i * chunkSize, i * chunkSize + chunkSize)
  );
