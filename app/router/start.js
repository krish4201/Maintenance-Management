const approuter = require("@sap/approuter");

const options = process.env.VCAP_APPLICATION
  ? {}
  : { xsappConfig: require("./xs-app-local.json") };

approuter().start(options);
