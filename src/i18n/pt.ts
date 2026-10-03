import type { UIStrings } from "./types";

// Draft — review with Antonio before launch (spec §9).
export default {
  siteName: "Antonio Netto",
  skipToContent: "Pular para o conteúdo",
  navLabel: "Principal",
  nav: {
    home: "Início",
    about: "Sobre",
    experiences: "Experiências",
    projects: "Projetos",
    blog: "Blog",
  },
  sayHello: "Diga olá",
  card: {
    role: "Executive Tech Manager",
    place: "no Inter · Belo Horizonte",
    profilesLabel: "Perfis",
    portraitAlt: "Retrato de Antonio Netto",
  },
  status: {
    shipping: "Publicado",
    "in-progress": "Em andamento",
    past: "Encerrado",
  },
  screenPlaceholder: "captura de tela",
  devOnly: "Só em dev",
  notFound: {
    title: "Página não encontrada",
    body: "Esta página não existe.",
    home: "Ir para o início",
  },
} satisfies UIStrings;
