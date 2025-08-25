import { PermissionsAndroid, Platform } from "react-native";

const requestAndroid31Permissions = async () => {
  const bluetoothScanPermission = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
    {
      title: "Location Permission",
      message: "Bluetooth Low Energy requires Location",
      buttonPositive: "OK",
    }
  );
  const bluetoothConnectPermission = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    {
      title: "Location Permission",
      message: "Bluetooth Low Energy requires location",
      buttonPositive: "OK",
    }
  );
  const fineLocationPermission = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: "Location Permission",
      message: "Bluetooth Low Energy requires Location",
      buttonPositive: "OK",
    }
  );

  return [
    bluetoothConnectPermission,
    bluetoothScanPermission,
    fineLocationPermission,
  ].every((permission) => permission === "granted");
};

export const requestPermissions = async () => {
  if (Platform.OS === "android") {
    return await requestAndroid31Permissions();
  } else return true;
};
