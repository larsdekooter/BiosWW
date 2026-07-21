import Dropdown from "@/components/Dropdown";
import ErrorModal from "@/components/ErrorModal";
import ProxsysOrangeButton from "@/components/ProxsysOrangeButton";
import { requestPermissions } from "@/useBLE";
import { useAuth } from "@clerk/expo";
import { AuthView, UserButton } from "@clerk/expo/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { extractTextFromImage } from "expo-text-extractor";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Button,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { BleManager, Device } from "react-native-ble-plx";
import { SafeAreaView } from "react-native-safe-area-context";

const serviceUUID = "180A";
const characteristicUUID = "2A57";
const snPrefixes: string[] = [
  "5CG",
  "5CD",
  "CND",
  "CNC",
  "CZC",
  "SCG",
  "SCD",
  "CNU",
  "8CC",
  "2CE",
];

export default function Index() {
  // Request Bluetooth permissions to connect to Arduino ESP32 NANO
  requestPermissions();

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const ref = useRef<CameraView>(null);
  const [uri, setUri] = useState<string | undefined>(undefined);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [serialNumber, setSerialNumber] = useState<string | null>(null);
  const [customer, setCustomer] = useState<string | null>(null);
  const [device, setDevice] = useState<Device | null>();
  // Check if user is signed in
  const { isSignedIn, isLoaded } = useAuth({ treatPendingAsSignedOut: false });
  const [devices, setDevices] = useState<Device[]>([]);

  function findNanos(bleManager: BleManager) {
    bleManager.startDeviceScan(
      ["180A"],
      { allowDuplicates: false },
      (error, discoverdDevice) => {
        if (error || !discoverdDevice)
          return console.error(
            "[BLE Scan Error]: ",
            error,
            "\n",
            discoverdDevice,
          );
        if (!discoverdDevice.name?.includes("BIOS")) return;

        setDevices((prevDevices) => {
          const exists = prevDevices.some(
            (dev) => dev.id === discoverdDevice.id,
          );
          if (exists) return prevDevices;
          return [...prevDevices, discoverdDevice];
        });
      },
    );
    setTimeout(() => {
      bleManager.stopDeviceScan();
      console.log("Found ", devices.length, " devices");
    }, 10000);
    return devices;
  }

  // Connect to the Arduino NANO ESP32
  const bleManager = new BleManager();
  useEffect(() => {
    (async () => {
      if (!device?.isConnected()) {
        console.log("not connected");
        findNanos(bleManager);
      }
    })();
  }, []);

  useEffect(() => {
    if (devices.length === 0 || device) return;
    const dev = devices[0];
    setDevice(dev);
    dev.onDisconnected(() => {
      console.log("Disconnected from ", dev.id);
      setErrorText("Geen verbinding");
      setDevice(null);
    });

    dev
      .connect()
      .then((d) => d.discoverAllServicesAndCharacteristics())
      .then((d) => {
        console.log("Connected to ", dev);
        setErrorText(null);
      })
      .catch(console.error);
  }, [devices]);

  // When Clerk is still loading show a spinner
  if (!isLoaded) {
    return (
      <View style={{ justifyContent: "center", alignItems: "center", flex: 1 }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  // Log user in
  if (!isSignedIn) {
    return <AuthView mode="signInOrUp" />;
  }

  // If the permissions are not loaded yet, show nothing. Should never happen because of isLoaded check
  if (!cameraPermission) {
    return <View />;
  }

  // Button to grant camera permissions
  if (!cameraPermission.granted) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Text style={{ textAlign: "center", paddingBottom: 10 }}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestCameraPermission} title="grant permission" />
      </View>
    );
  }

  const takePicture = async () => {
    const photo = await ref.current?.takePictureAsync({
      shutterSound: false,
      skipProcessing: false,
    });
    if (photo?.uri) {
      setUri(photo.uri);
      // Extract text from image. Returns an array where every element is a line.
      const text = await extractTextFromImage(photo.uri);
      // Find the line containing the serial number.
      const snLine = text.find(
        (string) =>
          string.includes("SN") || snPrefixes.includes(string.slice(0, 3)),
      );
      // Match the serial number out of the line (also checks if it is a valid serial number)
      const serialN = snLine?.match(
        /(5CG|5CD|CND|CNC|CZC|SCG|SCD|CNU|8CC|2CE).{7}/gm,
      )?.[0];
      if (serialN) {
        // Sometimes a 5 gets read as an S. Because no HP Serial Number starts with an S, but (almost) always with a 5, change these around
        if (serialN[0] === "S")
          return setSerialNumber(`5${serialN.substring(1)}`);
        return setSerialNumber(serialN);
      } else {
        // Show the error modal if the read serialnumber is invalid
        setErrorText("Could not read serial number");
        setSerialNumber(null);
        setUri(undefined);
        await wait(1500);
        setErrorText(null);
      }
    }
  };
  const renderPicture = () => {
    if (device == null && errorText == null)
      setErrorText("Geen verbinding met dongle!");
    return (
      <KeyboardAvoidingView
        style={{
          flex: 1,
          backgroundColor: "#181c20",
          alignItems: "center",
          justifyContent: "center",
        }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Dropdown
          data={devices.map(
            (d) => `${d.name} - ${d.id} - ${d.id === device?.id}`,
          )}
          renderText={(t) => (
            <View style={{ flexDirection: "row" }}>
              <Text
                style={{
                  color: t?.toString().includes("true")
                    ? "lightgreen"
                    : "white",
                  textAlign: "left",
                  flex: 1 / 2,
                }}
              >
                {t?.toString()?.split(" - ")?.[0]}
              </Text>
              <Text
                style={{
                  color: t?.toString().includes("true")
                    ? "lightgreen"
                    : "white",
                  textAlign: "right",
                  flex: 1 / 2,
                }}
              >
                {t?.toString()?.split(" - ")?.[1]}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View
              style={{
                marginVertical: 2,
                paddingVertical: 5,
                paddingHorizontal: 5,
                borderRadius: 8,
                borderColor: item.includes("true") ? "green" : "gray",
                borderWidth: 1,
                flexDirection: "row",
                flex: 1,
              }}
            >
              <Text
                style={{
                  color: item.includes("true") ? "lightgreen" : "white",
                  textAlign: "left",
                  flex: 1 / 2,
                }}
              >
                {item.split(" - ")[0]}
              </Text>
              <Text
                style={{
                  color: item.includes("true") ? "lightgreen" : "white",
                  textAlign: "right",
                  flex: 1 / 2,
                }}
              >
                {item.split(" - ")[1]}
              </Text>
            </View>
          )}
          onChoose={async (item) => {
            if (item.includes("true")) return;
            await device?.cancelConnection();
            setDevice(null);
            const dev = devices.find(
              (d) => d.id === item.split(" - ")[1].trim(),
            );
            if (!dev) return; //FIXME:
            setDevice(dev);
            await dev
              .connect()
              .then((d) => {
                console.log("Connected to device: ", d);
                setErrorText(null);
              })
              .catch(console.error);
          }}
        />

        <Text style={{ color: "#fff", paddingVertical: 5, fontWeight: "bold" }}>
          {serialNumber}
        </Text>
        <Image
          source={{ uri }}
          style={{
            width: 300,
            aspectRatio: 1,
            paddingVertical: 5,
            borderRadius: 6,
          }}
        />
        <ProxsysOrangeButton
          onPress={() => {
            setUri(undefined);
            setSerialNumber(null);
          }}
          style={{ marginBottom: 100 }}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>
            Maak een nieuwe foto
          </Text>
        </ProxsysOrangeButton>
        {typeof serialNumber === "string" && (
          <>
            <TextInput
              style={{
                backgroundColor: "white",
                width: 200,
                borderRadius: 8,
                paddingHorizontal: 10,
                height: 40,
                textAlignVertical: "center",
                paddingVertical: 5,
                color: "#000",
              }}
              placeholder="Klantcode"
              onChangeText={(input) => setCustomer(input ?? null)}
              placeholderTextColor={"#3a3a3a"}
            />
            <ProxsysOrangeButton
              onPress={async () => {
                if (!customer) {
                  setErrorText(null);
                  setErrorText("Voer een klantcode in!");
                  await wait(1500);
                  setErrorText(null);
                  return;
                }

                // TODO: Retrieve bios password
                // Write the retrieved BIOS Password to the esp32
                device!
                  .writeCharacteristicWithoutResponseForService(
                    serviceUUID,
                    characteristicUUID,
                    /*FIXME:*/ "Test",
                  )
                  .then(() => console.log("Send"))
                  .catch(console.error);
              }}
              disabled={device == null} // Disable the button when no Arduino has been connected
            >
              <Text
                style={{
                  color: device == null ? "#726f75" : "#fff",
                  // color: "white",
                  fontWeight: "bold",
                }}
              >
                Verzend
              </Text>
            </ProxsysOrangeButton>
          </>
        )}
      </KeyboardAvoidingView>
    );
  };
  const renderCamera = () => {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#181c20",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View></View>
        <CameraView
          style={{ width: "80%", height: "10%", borderRadius: 10 }}
          ref={ref}
          mode="picture"
          facing="back"
          responsiveOrientationWhenOrientationLocked
          autofocus="on"
          zoom={0.1}
        />
        <Pressable onPress={takePicture}>
          {({ pressed }) => (
            <View
              style={{
                backgroundColor: "transparent",
                borderWidth: 5,
                borderColor: "#fff",
                width: 85,
                height: 85,
                borderRadius: 45,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.5 : 1,
              }}
            >
              <View
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 50,
                  backgroundColor: "#fff",
                }}
              />
            </View>
          )}
        </Pressable>
      </View>
    );
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#181c20" }}>
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          overflow: "hidden",
          marginLeft: 10,
          marginTop: 10,
        }}
      >
        <UserButton />
      </View>
      {uri ? renderPicture() : renderCamera()}
      <ErrorModal text={errorText} />
    </SafeAreaView>
  );
}

function wait(duration: number) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, duration);
  });
}
