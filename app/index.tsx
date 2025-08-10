import { FontAwesome } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { extractTextFromImage } from "expo-text-extractor";
import { fetch } from "expo/fetch";
import { useRef, useState } from "react";
import {
  Button,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
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
  const [serialNumber, setSerialNumber] = useState<string | null>(null);
  const [customer, setCustomer] = useState<string | null>(null);

  if (!permission) {
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
      const serialN = snLine?.match(
        /(?<=SN.\s)(5CG|5CD|CND|CNC|CZC|SCG|SCD|CNU|8CC|2CE).{7}/gm
      )?.[0];
      if (serialN) {
        if (serialN[0] === "S") `5${serialN.substring(1)}`;
        setSerialNumber(serialN);
      } else {
        setErrorText("Could not read serial number");
        setSerialNumber(null);
        setUri(undefined);
        setTimeout(() => {
          setErrorText(null);
        }, 3000);
      }
    }
  };
  const renderPicture = () => {
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
        <Text style={{ color: "#fff", paddingVertical: 5 }}>
          {serialNumber}
        </Text>
        <Image
          source={{ uri }}
          style={{ width: 300, aspectRatio: 1, paddingVertical: 5 }}
        />
        <Pressable
          onPress={() => {
            setUri(undefined);
            setSerialNumber(null);
          }}
          style={{
            padding: 5,
            backgroundColor: "#ff8700",
            margin: 5,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: "#fff" }}>Retake</Text>
        </Pressable>
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
            />
            <Pressable
              style={{
                padding: 5,
                backgroundColor: "#ff8700",
                margin: 5,
                borderRadius: 10,
              }}
              onPress={async () => {
                if (!customer) return; //TODO: Implement error message here
                // Request from n8n (Proxsys goes n8n???)
                const response = await fetch(
                  "http://192.168.1.17:5678/webhook/1653088f-94d9-4919-b763-d5f66870c30a",
                  {
                    headers: {
                      customer,
                      serialNumber,
                      // Accestoken
                    },
                  }
                ).then((res) => res.json());
              }}
            >
              <Text style={{ color: "#fff" }}>Verzend</Text>
            </Pressable>
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
