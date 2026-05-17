import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BloxBuild Hub",
    short_name: "BloxBuild",
    description: "Discover beautiful Bloxburg architectural designs, browse aesthetic linen cottages, hire elite pro builders, and manage commissions on the ultimate Roblox community exchange.",
    start_url: "/",
    display: "standalone",
    background_color: "#0B0E14",
    theme_color: "#FF385C",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
