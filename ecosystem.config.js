module.exports = {
  apps: [
    {
      name: "brewpos",
      script: "node_modules/.bin/next",
      args: "start -p 3000",
      cwd: "/var/www/brewpos",
      env: {
        NODE_ENV: "production",
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
    },
  ],
};
