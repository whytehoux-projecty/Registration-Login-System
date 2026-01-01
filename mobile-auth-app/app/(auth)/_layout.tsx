import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "@/stores/authStore";

export default function AuthLayout() {
  const { authKey, onboardingComplete } = useAuthStore();

  if (!authKey || !onboardingComplete) {
    return <Redirect href="/(onboarding)/welcome" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTintColor: "#f8fafc",
        headerStyle: { backgroundColor: "#0f172a" },
      }}
    />
  );
}
