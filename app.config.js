const IS_DEV = process.env.APP_VARIANT === "development";

const getUniqueIdentifier = () => {
  if (IS_DEV) return "com.ldekooter.BiosWW.dev";
  return "com.ldekooter.BiosWW";
};

const getAppName = () => {
  if (IS_DEV) return "BiosWW (Dev)";
  return "BiosWW";
};

export default ({ config }) => ({
  ...config,
  name: getAppName(),
  ios: {
    ...config.ios,
    bundleIdentifier: getUniqueIdentifier(),
  },
  android: {
    ...config.android,
    package: getUniqueIdentifier(),
  },
});
