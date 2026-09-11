import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // A foto de perfil vai em base64 pela Server Action de "Editar Perfil"
      // (ver src/views/perfil/EditarPerfilModal.tsx); o limite padrão é 1MB.
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
