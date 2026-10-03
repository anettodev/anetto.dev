import type { UIStrings } from "./types";

// Draft — review with Antonio before launch (spec §9).
export default {
  siteName: "Antonio Netto",
  skipToContent: "Saltar al contenido",
  navLabel: "Principal",
  nav: {
    home: "Inicio",
    about: "Sobre mí",
    experiences: "Experiencias",
    projects: "Proyectos",
    blog: "Blog",
  },
  sayHello: "Saluda",
  menu: { open: "Abrir navegación", close: "Cerrar navegación" },
  theme: {
    toLight: "Cambiar al modo claro",
    toDark: "Cambiar al modo oscuro",
  },
  languageLabel: "Idioma: Español",
  card: {
    role: "Executive Tech Manager",
    place: "en Inter · Belo Horizonte",
    profilesLabel: "Perfiles",
    portraitAlt: "Retrato de Antonio Netto",
  },
  status: {
    shipping: "Publicado",
    "in-progress": "En desarrollo",
    past: "Anterior",
  },
  intro: { skip: "Saltar intro", at: "en" },
  screenPlaceholder: "captura de pantalla",
  devOnly: "Solo en dev",
  notFound: {
    title: "Página no encontrada",
    body: "Esta página no existe.",
    home: "Ir al inicio",
  },
} satisfies UIStrings;
