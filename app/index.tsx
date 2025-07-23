import { FontAwesome } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { extractTextFromImage } from "expo-text-extractor";
import { useRef, useState } from "react";
import {
  Button,
  Image,
  Modal,
  Pressable,
  Text,
  View,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function ErrorModal({ text }: { text: string | null }) {
  return (
    <Modal animationType="slide" transparent visible={text != null}>
      <View
        style={{
          bottom: 30,
          backgroundColor: "#323332",
          height: 50,
          width: "90%",
          alignSelf: "center",
          position: "absolute",
          justifyContent: "space-around",
          flex: 1,
          alignItems: "center",
          borderRadius: 4,
          flexDirection: "row",
        }}
      >
        <FontAwesome name="exclamation-circle" size={20} color={"red"} />
        <Text style={{ color: "#fff" }}>{text}</Text>
      </View>
    </Modal>
  );
}

export default function Index() {
  const [permission, requestPermission] = useCameraPermissions();
  const ref = useRef<CameraView>(null);
  const [uri, setUri] = useState<string | undefined>(undefined);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [inputShown, setInputShown] = useState(false);

  if (!permission) {
    console.log(!permission);
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Text style={{ textAlign: "center", paddingBottom: 10 }}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="grant permission" />
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
      const text = await extractTextFromImage(photo.uri);
      const snLine = text.find((string) => string.includes("SN"));
      const serialNumber = snLine?.match(
        /(?<=SN.\s)(5CG|5CD|CND|CNC|CZC|SCG|SCD|CNU|8CC|2CE).{7}/gm
      );
      if (serialNumber) {
        if (serialNumber[0] === "S") serialNumber[0] = "5";
        setInputShown(true);
      } else {
        setErrorText("Could not read serial number");
        setUri(undefined);
        setTimeout(() => {
          setErrorText(null);
        }, 3000);
      }
    }
  };
  const renderPicture = () => {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#181c20",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Image source={{ uri }} style={{ width: 300, aspectRatio: 1 }} />
        <Button onPress={() => setUri(undefined)} title="Retake" />
        {inputShown && (
          <>
            <TextInput
              style={{
                backgroundColor: "white",
                width: 200,
                borderRadius: 8,
                paddingHorizontal: 10,
                height: 40,
                textAlignVertical: "center",
                paddingVertical: 0,
                color: "#000",
              }}
              placeholder="Klantcode"
            />
            <Pressable
              onPress={() => {
                //TODO: lmp connection
              }}
            >
              <Text style={{ color: "#fff" }}>Verzend</Text>
            </Pressable>
          </>
        )}
      </View>
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
        <View style={{ height: 90 }}></View>
        <CameraView
          style={{ width: "80%", height: "10%", borderRadius: 10 }}
          ref={ref}
          mode="picture"
          facing="back"
          responsiveOrientationWhenOrientationLocked
          autofocus="on"
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
      {uri ? renderPicture() : renderCamera()}
      <ErrorModal text={errorText} />
    </SafeAreaView>
  );
}
