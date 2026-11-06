import type { CapacitorConfig } from "@capacitor/cli";

// CAP_LOCAL_API=1 só para testar no emulador contra o backend do próprio computador
// (http://10.0.2.2:4000). O APK de verdade usa a API do Render em https e não libera http.
const localApi = process.env.CAP_LOCAL_API === "1";

const config: CapacitorConfig = {
  appId: "br.com.arrumaaqui.app",
  appName: "Arruma Aqui",
  webDir: "dist",
  android: {
    allowMixedContent: localApi,
  },
  server: localApi ? { cleartext: true } : undefined,
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      backgroundColor: "#14171F",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#14171F",
      overlaysWebView: false,
    },
  },
};

export default config;
