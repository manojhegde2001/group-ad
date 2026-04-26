module.exports = {
  apps: [
    {
      name: 'group-ad',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
