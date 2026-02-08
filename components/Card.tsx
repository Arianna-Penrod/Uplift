import React from "react";
import { View, StyleProp, ViewStyle } from "react-native";

export function Card({
    children,
    style,
}: {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
}) {
    return (
        <View style={[{
            padding: 12,
            borderWidth: 1,
            borderRadius: 10,
            gap: 10,
            backgroundColor: "rgba(255,255,255,0.92)",
            borderColor: "rgba(0,0,0,0.12)",
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 6 },
            elevation: 2,
        }, style]}>
            {children}
        </View>
    );
}
