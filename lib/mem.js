module.exports = () => {
  const used = process.memoryUsage();
  Object.keys(used).forEach(k => {
    console.log(`${k} ${Math.round((used[k] / 1024 / 1024) * 100) / 100} MB`);
  });
};
