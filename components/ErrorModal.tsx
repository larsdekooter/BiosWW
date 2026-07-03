import { FontAwesome } from "@expo/vector-icons";
import { Fragment } from "react";
import { Text } from "react-native";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";

export default function ErrorModal({ text }: { text: string | null }) {
  return (
    <Fragment>
      {text != null && (
        <Animated.View
          style={{
            bottom: 40,
            backgroundColor: "#da4a43",
            height: 50,
            width: "90%",
            alignSelf: "center",
            position: "absolute",
            justifyContent: "space-evenly",
            flex: 1,
            alignItems: "center",
            borderRadius: 4,
            flexDirection: "row",
            borderColor: "#FF7D00",
            borderWidth: 1,
          }}
          entering={SlideInDown.duration(300)}
          exiting={SlideOutDown.duration(300)}
        >
          <FontAwesome name="exclamation-circle" size={20} color={"white"} />
          <Text style={{ color: "#fff", fontWeight: "bold" }}>{text}</Text>
          <FontAwesome name="exclamation-circle" size={20} color={"white"} />
        </Animated.View>
      )}
    </Fragment>
  );
}
