import { Pressable, PressableProps } from "react-native";

export default function ProxsysOrangeButton(props: PressableProps) {
  return (
    <Pressable
      {...props}
      style={(state) => [
        {
          paddingHorizontal: 20,
          paddingVertical: 10,
          backgroundColor: props.disabled ? "#2c2a2e" : "#FF7D00",
          margin: 5,
          borderRadius: 3,
        },
        typeof props.style === "function" ? props.style(state) : props.style,
      ]}
    >
      {props.children}
    </Pressable>
  );
}
