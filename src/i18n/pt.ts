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
  menu: { open: "Abrir navegação", close: "Fechar navegação" },
  theme: {
    toLight: "Mudar para o modo claro",
    toDark: "Mudar para o modo escuro",
  },
  languageLabel: "Idioma: Português",
  card: {
    role: "Executive Tech Manager",
    at: "no",
    profilesLabel: "Perfis",
    portraitAlt: "Retrato de Antonio Netto",
  },
  status: {
    shipping: "Publicado",
    "in-progress": "Em desenvolvimento",
    past: "Encerrado",
  },
  intro: { loading: "Carregando..." },
  screenPlaceholder: "captura de tela",
  devOnly: "Só em dev",
  notFound: {
    title: "Página não encontrada",
    body: "Esta página não existe.",
    home: "Ir para o início",
  },
} satisfies UIStrings;
