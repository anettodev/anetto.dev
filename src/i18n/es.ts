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
    ai: "IA",
    bookmarks: "Marcadores",
  },
  menu: { open: "Abrir navegación", close: "Cerrar navegación" },
  theme: {
    toLight: "Cambiar al modo claro",
    toDark: "Cambiar al modo oscuro",
  },
  languageLabel: "Idioma: Español",
  card: {
    role: "Executive Tech Manager",
    at: "en",
    profilesLabel: "Perfiles",
    portraitAlt: "Retrato de Antonio Netto",
    bookCall: "Agendar una llamada",
    bookCallLabel: "Agendar una llamada por Calendly",
  },
  status: {
    todo: "Planeado",
    wip: "En desarrollo",
    done: "Publicado",
  },
  intro: { loading: "Cargando..." },
  github: {
    title: "Actividad en GitHub",
    profileLink: "Ver en GitHub",
    total: {
      one: "{n} contribución en el último año",
      other: "{n} contribuciones en el último año",
    },
    day: {
      zero: "Ninguna contribución el {date}",
      one: "{n} contribución el {date}",
      other: "{n} contribuciones el {date}",
    },
    calendarLabel: "Calendario de contribuciones, del {start} al {end}",
    top: "Principales contribuciones públicas en:",
    topToggle: "Listar los principales repositorios públicos",
    commits: { one: "commit", other: "commits" },
    updated: "Actualizado el {date}",
  },
  ai: {
    title: "Uso de IA",
    page: {
      label: "IA",
      title: "Mi uso real, a la vista.",
      lead: "He trabajado con muchas herramientas y proveedores de IA, y hoy son parte de cómo escribo software. Las cifras de abajo vienen de los registros locales de sesión de cada herramienta, contadas por tokscale y sincronizadas a diario.",
      description:
        "Uso diario de tokens en herramientas de IA para programar, con los modelos y las herramientas detrás.",
    },
    cost: {
      label: "Costo equivalente en API",
      detail: "Unos {amount} por día activo",
    },
    tokens: {
      label: "Tokens",
      detail: "{messages} mensajes en {days} días activos",
    },
    cache: {
      label: "Tokens de prompt leídos de la caché",
      detail: "{read} leídos · {write} escritos",
    },
    day: {
      zero: "Sin uso de IA el {date}",
      one: "{n} token el {date}{note}",
      other: "{n} tokens el {date}{note}",
    },
    calendarLabel: "Uso diario de tokens de IA, del {start} al {end}",
    chart: {
      label: "Gráfico",
      heatmap: "Mapa de calor",
      trend: "En el tiempo",
      heatmapCaption: "Tokens por día",
      rangeLabel: "Días mostrados",
      days: "días",
      trendLabel:
        "Tokens por día por modelo, últimos {n} días: del {start} al {end}",
      daily: "Diario",
      weekly: "Media de 7 días",
      total: "Total de tokens",
      empty: "Sin uso de IA en estos días",
    },
    since: "Desde el {date}",
    synced: "Sincronizado el {date}",
    models: {
      title: "Modelos",
      caption: "Por costo equivalente en API",
      other: "Otros modelos",
    },
    agents: {
      title: "Agentes",
      caption: "Todo el período",
      agent: "Agente",
      source: "Origen",
      messages: "Mensajes",
      none: "Aún no hay uso de agentes.",
      updated: "Agentes actualizados el {date}.",
    },
    clients: {
      title: "Herramientas y proveedores",
      tool: "Herramienta",
      cost: "Costo",
      tokens: "Tokens",
      share: "Proporción",
      window: {
        before: "Últimos",
        after: "días",
        label: "Días que cubren las flechas de la proporción",
      },
      points: "{n} p. p.",
      trend: {
        up: "sube {n} puntos porcentuales frente a los {days} días anteriores",
        down: "baja {n} puntos porcentuales frente a los {days} días anteriores",
      },
    },
    costNote:
      "Los costos son estimaciones de tokscale a precios públicos de API.",
    via: "Contado por tokscale",
    empty:
      "[PLACEHOLDER: el uso de IA aparece aquí tras la primera sincronización de tokscale]",
  },
  pager: {
    label: "Páginas",
    prev: "Anterior",
    next: "Siguiente",
    page: "Página {n}",
  },
  blogPage: {
    search: {
      label: "Buscar escritos",
      placeholder: "Buscar en títulos, resúmenes y etiquetas",
    },
    noMatch: "Ningún escrito coincide con la búsqueda y los filtros.",
    perPage: "Escritos por página",
    sourceFilter: "Filtrar por fuente",
  },
  projectsPage: {
    pinned: "Destacados",
    all: "Todos los proyectos",
    carousel: "Proyectos destacados",
    prev: "Proyectos anteriores",
    next: "Siguientes proyectos",
    dots: "Elegir un proyecto destacado",
    show: "Mostrar {title}",
    count: { one: "{n} proyecto", other: "{n} proyectos" },
    search: {
      label: "Buscar proyectos",
      placeholder: "Buscar en títulos y descripciones",
    },
    noMatch: "Ningún proyecto coincide con la búsqueda y los filtros.",
    perPage: "Proyectos por página",
    statusFilter: "Filtrar por estado",
    stack: "Stack",
    stackFilter: "Filtrar por stack",
  },
  list: {
    all: "Todos",
    results: "Mostrando {from}–{to} de {total}",
    perPage: { before: "Mostrar", after: "por página" },
    sort: {
      label: "Ordenar",
      date: "Fecha",
      title: "Título",
      newest: "más recientes primero",
      oldest: "más antiguos primero",
      az: "de la A a la Z",
      za: "de la Z a la A",
      spoken: "Ordenar por {key}, {dir}",
    },
  },
  bookmarks: {
    label: "Marcadores",
    title: "Marcadores",
    lead: "Una estantería pública de los enlaces que he guardado: artículos, vídeos, herramientas, sitios web y proyectos de GitHub que merecen una segunda mirada.",
    description:
      "Marcadores públicos de Raindrop: enlaces guardados para después, de los más recientes a los más antiguos.",
    filterLabel: "Filtrar por colección",
    updated: "Actualizado el {date}",
    viewOnRaindrop: "Ver en Raindrop",
    empty:
      "[PLACEHOLDER: los marcadores públicos de Raindrop aparecen aquí tras la primera actualización]",
    none: "Aún no hay marcadores públicos.",
    search: {
      label: "Buscar marcadores",
      placeholder: "Buscar en títulos y descripciones",
    },
    noMatch: "Ningún marcador coincide con la búsqueda.",
    perPage: "Marcadores por página",
  },
  tldr: {
    label: "TL;DR",
    hint: "Resumir esta página con {provider} (se abre en una pestaña nueva)",
    choose: "Elegir un asistente de IA",
    menuTitle: "Resumir con",
    prompt:
      "Por favor, abre esta URL con búsqueda web y lee la página completa: {url}\n\n{context} Después de leer su contenido real, haz lo siguiente:\n1) {summary}\n2) Dime qué detalles me pierdo por no leer la página completa. Sé lo bastante específico como para despertar mi curiosidad.\n3) Recuérdame que puedo seguir haciendo preguntas sobre ella aquí mismo, en este chat.\n4) Sugiere una buena pregunta para empezar.",
    pages: {
      experiences: {
        context: "Es la página de experiencia profesional de Antonio Netto.",
        summary:
          "Resume su carrera en los 5 puntos más importantes (cargos, empresas, años y enfoque) y una conclusión de una línea.",
      },
      about: {
        context: "Es la página Sobre mí de Antonio Netto.",
        summary:
          "Resume quién es en los 5 puntos más importantes (qué hace hoy, su trayectoria y lo que valora) y una conclusión de una línea.",
      },
      ai: {
        context:
          "Es la página de Antonio Netto sobre cómo usa herramientas de IA para programar, con sus datos reales de uso.",
        summary:
          "Resúmela en los 5 puntos más importantes (herramientas, modelos, agentes y cuánto los usa) y una conclusión de una línea.",
      },
      post: {
        context: "Es una nota de Antonio Netto, “{title}”.",
        summary: "Resume los 5 puntos más importantes y la conclusión.",
      },
    },
  },
  podcasts: {
    label: "Podcasts",
    title: "Lista de podcasts",
    count: { one: "{n} programa", other: "{n} programas" },
    back: "Todos los podcasts",
    player: "Reproductor de Spotify: {show}",
    listen: "Escuchar en Spotify",
    episodes: "Todos los episodios en Spotify",
    mock: "[PLACEHOLDER: reproductor de Spotify, cuando podcasts:refresh esté conectado]",
  },
  music: {
    heading: "Mi playlist",
    title: "Playlist en Apple Music",
    listen: "Escuchar en Apple Music",
    placeholder: "[PLACEHOLDER: enlace de la playlist en Apple Music]",
  },
  tech: {
    title: "Stack tecnológico",
    empty: "[PLACEHOLDER: las tecnologías a mostrar]",
    count: { one: "{n} tecnología", other: "{n} tecnologías" },
  },
  experience: {
    present: "Actualidad",
    more: { one: "{n} experiencia más", other: "{n} experiencias más" },
    timeline: "Línea de tiempo",
    unknownLength: "[PLACEHOLDER: años]",
    unknownStart: "[PLACEHOLDER: fecha de inicio]",
  },
  post: {
    readMore: "Leer más",
    note: "Nota",
    back: "Todos los textos",
    updated: "Actualizado el {date}",
  },
  project: {
    appStore: "App Store",
    demo: "Demo en vivo",
    source: "Código fuente",
    website: "Sitio web",
    stack: "Hecho con",
    cover: "imagen de portada",
  },
  devOnly: "Solo en dev",
  notFound: {
    title: "Página no encontrada",
    body: "Esta página no existe.",
    home: "Ir al inicio",
  },
} satisfies UIStrings;
