export const PRESETS = {
  redesSociales: { 
    label: "Redes sociales", 
    domains: ["facebook.com", "instagram.com", "x.com", "tiktok.com", "reddit.com"] 
  },
  streaming: { 
    label: "Streaming", 
    domains: ["netflix.com", "youtube.com", "twitch.tv", "primevideo.com", "disneyplus.com"] 
  },
  noticias: { 
    label: "Noticias", 
    domains: ["cnn.com", "bbc.com", "reforma.com", "milenio.com"] 
  },
  compras: { 
    label: "Compras", 
    domains: ["amazon.com", "mercadolibre.com", "aliexpress.com", "shein.com"] 
  },
} as const;

export type PresetKey = keyof typeof PRESETS;
