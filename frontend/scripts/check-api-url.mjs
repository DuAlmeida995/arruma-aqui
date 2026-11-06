// O APK de distribuição precisa apontar para a API publicada (https), não para o computador local.
const url = process.env.VITE_API_URL || "";
if (!/^https:\/\/.+\/api$/.test(url)) {
  console.error(
    "Defina VITE_API_URL com o endereço https da API terminando em /api, por exemplo:\n" +
      "  VITE_API_URL=https://arruma-aqui-api.onrender.com/api npm run app:apk\n" +
      "Para testar no emulador contra o backend local, use: npm run app:apk:local"
  );
  process.exit(1);
}
console.log(`APK vai usar a API em ${url}`);
