module.exports = {
  packagerConfig: {
    asar: true,
    executableName: "CondoDesktopLauncher",
    ignore: [
      /^\/out($|\/)/,
      /^\/node_modules\/app($|\/)/
    ]
  },
  makers: []
};
