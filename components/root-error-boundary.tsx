import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";

import { SchemeColors } from "@/constants/theme";

type Props = { children: ReactNode };
type State = { error: Error | null; componentStack: string | null };

const bg = SchemeColors.light.background;

/**
 * Affiche une erreur au lieu d'un écran blanc si le rendu racine plante (souvent visible sur appareil en release).
 */
export class RootErrorBoundary extends Component<Props, State> {
  state: State = { error: null, componentStack: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error, componentStack: null };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[RootErrorBoundary]", error, info.componentStack);
    this.setState({ componentStack: info.componentStack ?? null });
  }

  private handleRetry = (): void => {
    this.setState({ error: null, componentStack: null });
  };

  render(): ReactNode {
    if (this.state.error) {
      const { error, componentStack } = this.state;
      return (
        <View
          style={{
            flex: 1,
            padding: 24,
            justifyContent: "center",
            backgroundColor: bg,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 8, color: SchemeColors.light.foreground }}>
            Une erreur a interrompu l’affichage
          </Text>
          <Text style={{ marginBottom: 12, color: SchemeColors.light.muted }}>
            Si le problème persiste, ouvrez Metro / Xcode pour voir la trace complète.
          </Text>
          <ScrollView style={{ maxHeight: "60%" }}>
            <Text
              selectable
              style={{
                fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                fontSize: 12,
                color: SchemeColors.light.foreground,
              }}
            >
              {error.message}
              {__DEV__ && componentStack ? `\n\n${componentStack}` : ""}
            </Text>
          </ScrollView>
          <Pressable
            onPress={this.handleRetry}
            style={{
              marginTop: 20,
              paddingVertical: 12,
              paddingHorizontal: 16,
              backgroundColor: SchemeColors.light.primary,
              borderRadius: 8,
              alignSelf: "flex-start",
            }}
          >
            <Text style={{ color: "#FAF8F4", fontWeight: "600" }}>Réessayer</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}
