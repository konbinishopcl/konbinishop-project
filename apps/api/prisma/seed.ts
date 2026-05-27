/**
 * Seed de konbini-nest-api.
 * Idempotente: limpia todas las tablas y vuelve a poblar con datos de ejemplo.
 * Geografía: Chile como Country, 16 regiones como States, comunas como Cities.
 * Ejecutar: yarn prisma:seed
 */
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

/** Genera un slug url-safe: minúsculas, sin acentos, separado por guiones. */
function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ─────────────── Regiones y comunas de Chile ───────────────
const regionsData: { region: string; communes: string[] }[] = [
  { region: 'Arica y Parinacota', communes: ['Arica', 'Camarones', 'Putre', 'General Lagos'] },
  {
    region: 'Tarapacá',
    communes: ['Iquique', 'Alto Hospicio', 'Pozo Almonte', 'Camiña', 'Colchane', 'Huara', 'Pica'],
  },
  {
    region: 'Antofagasta',
    communes: [
      'Antofagasta', 'Mejillones', 'Sierra Gorda', 'Taltal', 'Calama', 'Ollagüe',
      'San Pedro de Atacama', 'Tocopilla', 'María Elena',
    ],
  },
  {
    region: 'Atacama',
    communes: [
      'Copiapó', 'Caldera', 'Tierra Amarilla', 'Chañaral', 'Diego de Almagro', 'Vallenar',
      'Alto del Carmen', 'Freirina', 'Huasco',
    ],
  },
  {
    region: 'Coquimbo',
    communes: [
      'La Serena', 'Coquimbo', 'Andacollo', 'La Higuera', 'Paiguano', 'Vicuña', 'Illapel',
      'Canela', 'Los Vilos', 'Salamanca', 'Ovalle', 'Combarbalá', 'Monte Patria', 'Punitaqui',
      'Río Hurtado',
    ],
  },
  {
    region: 'Valparaíso',
    communes: [
      'Valparaíso', 'Casablanca', 'Concón', 'Juan Fernández', 'Puchuncaví', 'Quintero',
      'Viña del Mar', 'Isla de Pascua', 'Los Andes', 'Calle Larga', 'Rinconada', 'San Esteban',
      'La Ligua', 'Cabildo', 'Papudo', 'Petorca', 'Zapallar', 'Quillota', 'Calera', 'Hijuelas',
      'La Cruz', 'Nogales', 'San Antonio', 'Algarrobo', 'Cartagena', 'El Quisco', 'El Tabo',
      'Santo Domingo', 'San Felipe', 'Catemu', 'Llaillay', 'Panquehue', 'Putaendo', 'Santa María',
      'Quilpué', 'Limache', 'Olmué', 'Villa Alemana',
    ],
  },
  {
    region: "Región del Libertador Gral. Bernardo O'Higgins",
    communes: [
      'Rancagua', 'Codegua', 'Coinco', 'Coltauco', 'Doñihue', 'Graneros', 'Las Cabras',
      'Machalí', 'Malloa', 'Mostazal', 'Olivar', 'Peumo', 'Pichidegua', 'Quinta de Tilcoco',
      'Rengo', 'Requínoa', 'San Vicente', 'Pichilemu', 'La Estrella', 'Litueche', 'Marchihue',
      'Navidad', 'Paredones', 'San Fernando', 'Chépica', 'Chimbarongo', 'Lolol', 'Nancagua',
      'Palmilla', 'Peralillo', 'Placilla', 'Pumanque', 'Santa Cruz',
    ],
  },
  {
    region: 'Región del Maule',
    communes: [
      'Talca', 'Constitución', 'Curepto', 'Empedrado', 'Maule', 'Pelarco', 'Pencahue',
      'Río Claro', 'San Clemente', 'San Rafael', 'Cauquenes', 'Chanco', 'Pelluhue', 'Curicó',
      'Hualañé', 'Licantén', 'Molina', 'Rauco', 'Romeral', 'Sagrada Familia', 'Teno',
      'Vichuquén', 'Linares', 'Colbún', 'Longaví', 'Parral', 'Retiro', 'San Javier',
      'Villa Alegre', 'Yerbas Buenas',
    ],
  },
  {
    region: 'Región de Ñuble',
    communes: [
      'Cobquecura', 'Coelemu', 'Ninhue', 'Portezuelo', 'Quirihue', 'Ránquil', 'Treguaco',
      'Bulnes', 'Chillán Viejo', 'Chillán', 'El Carmen', 'Pemuco', 'Pinto', 'Quillón',
      'San Ignacio', 'Yungay', 'Coihueco', 'Ñiquén', 'San Carlos', 'San Fabián', 'San Nicolás',
    ],
  },
  {
    region: 'Región del Biobío',
    communes: [
      'Concepción', 'Coronel', 'Chiguayante', 'Florida', 'Hualqui', 'Lota', 'Penco',
      'San Pedro de la Paz', 'Santa Juana', 'Talcahuano', 'Tomé', 'Hualpén', 'Lebu', 'Arauco',
      'Cañete', 'Contulmo', 'Curanilahue', 'Los Álamos', 'Tirúa', 'Los Ángeles', 'Antuco',
      'Cabrero', 'Laja', 'Mulchén', 'Nacimiento', 'Negrete', 'Quilaco', 'Quilleco',
      'San Rosendo', 'Santa Bárbara', 'Tucapel', 'Yumbel', 'Alto Biobío',
    ],
  },
  {
    region: 'Región de la Araucanía',
    communes: [
      'Temuco', 'Carahue', 'Cunco', 'Curarrehue', 'Freire', 'Galvarino', 'Gorbea', 'Lautaro',
      'Loncoche', 'Melipeuco', 'Nueva Imperial', 'Padre las Casas', 'Perquenco', 'Pitrufquén',
      'Pucón', 'Saavedra', 'Teodoro Schmidt', 'Toltén', 'Vilcún', 'Villarrica', 'Cholchol',
      'Angol', 'Collipulli', 'Curacautín', 'Ercilla', 'Lonquimay', 'Los Sauces', 'Lumaco',
      'Purén', 'Renaico', 'Traiguén', 'Victoria',
    ],
  },
  {
    region: 'Región de Los Ríos',
    communes: [
      'Valdivia', 'Corral', 'Lanco', 'Los Lagos', 'Máfil', 'Mariquina', 'Paillaco',
      'Panguipulli', 'La Unión', 'Futrono', 'Lago Ranco', 'Río Bueno',
    ],
  },
  {
    region: 'Región de Los Lagos',
    communes: [
      'Puerto Montt', 'Calbuco', 'Cochamó', 'Fresia', 'Frutillar', 'Los Muermos', 'Llanquihue',
      'Maullín', 'Puerto Varas', 'Castro', 'Ancud', 'Chonchi', 'Curaco de Vélez', 'Dalcahue',
      'Puqueldón', 'Queilén', 'Quellón', 'Quemchi', 'Quinchao', 'Osorno', 'Puerto Octay',
      'Purranque', 'Puyehue', 'Río Negro', 'San Juan de la Costa', 'San Pablo', 'Chaitén',
      'Futaleufú', 'Hualaihué', 'Palena',
    ],
  },
  {
    region: 'Región Aisén del Gral. Carlos Ibáñez del Campo',
    communes: [
      'Coihaique', 'Lago Verde', 'Aisén', 'Cisnes', 'Guaitecas', 'Cochrane', "O'Higgins",
      'Tortel', 'Chile Chico', 'Río Ibáñez',
    ],
  },
  {
    region: 'Región de Magallanes y de la Antártica Chilena',
    communes: [
      'Punta Arenas', 'Laguna Blanca', 'Río Verde', 'San Gregorio', 'Cabo de Hornos (Ex Navarino)',
      'Antártica', 'Porvenir', 'Primavera', 'Timaukel', 'Natales', 'Torres del Paine',
    ],
  },
  {
    region: 'Región Metropolitana de Santiago',
    communes: [
      'Cerrillos', 'Cerro Navia', 'Conchalí', 'El Bosque', 'Estación Central', 'Huechuraba',
      'Independencia', 'La Cisterna', 'La Florida', 'La Granja', 'La Pintana', 'La Reina',
      'Las Condes', 'Lo Barnechea', 'Lo Espejo', 'Lo Prado', 'Macul', 'Maipú', 'Ñuñoa',
      'Pedro Aguirre Cerda', 'Peñalolén', 'Providencia', 'Pudahuel', 'Quilicura',
      'Quinta Normal', 'Recoleta', 'Renca', 'Santiago', 'San Joaquín', 'San Miguel', 'San Ramón',
      'Vitacura', 'Puente Alto', 'Pirque', 'San José de Maipo', 'Colina', 'Lampa', 'Tiltil',
      'San Bernardo', 'Buin', 'Calera de Tango', 'Paine', 'Melipilla', 'Alhué', 'Curacaví',
      'María Pinto', 'San Pedro', 'Talagante', 'El Monte', 'Isla de Maipo', 'Padre Hurtado',
      'Peñaflor',
    ],
  },
];

async function main() {
  console.log('🌱 Seeding konbini-nest-api...');

  // ── Limpieza (orden FK-safe) ──
  await prisma.like.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.subscriber.deleteMany();
  await prisma.event.deleteMany();
  await prisma.article.deleteMany();
  await prisma.hero.deleteMany();
  await prisma.spot.deleteMany();
  // Geografía: City → State → Country
  await prisma.city.deleteMany();
  await prisma.state.deleteMany();
  await prisma.country.deleteMany();
  await prisma.category.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  // ── Geografía: Chile como Country, regiones como States, comunas como Cities ──

  // 1. País Chile
  const chile = await prisma.country.upsert({
    where: { slug: 'chile' },
    update: {},
    create: { name: 'Chile', slug: 'chile' },
  });

  // 2. States (16 regiones) y Cities (comunas)
  for (const { region, communes } of regionsData) {
    const stateSlug = slugify(region);
    const state = await prisma.state.upsert({
      where: { slug: stateSlug },
      update: { name: region, countryId: chile.id },
      create: { name: region, slug: stateSlug, countryId: chile.id },
    });

    for (const communeName of communes) {
      const citySlug = slugify(communeName);
      await prisma.city.upsert({
        where: { slug: citySlug },
        update: { name: communeName, stateId: state.id },
        create: { name: communeName, slug: citySlug, stateId: state.id },
      });
    }
  }

  const totalCities = regionsData.reduce((acc, r) => acc + r.communes.length, 0);
  console.log(`✓ Geografía seeded: 1 country, ${regionsData.length} states, ${totalCities} cities`);

  // Mapa slug -> registro de ciudad, para referenciar en eventos
  const cityBySlug = new Map(
    (await prisma.city.findMany()).map((c) => [c.slug, c]),
  );
  const city = (slug: string) => {
    const c = cityBySlug.get(slug);
    if (!c) throw new Error(`Ciudad no encontrada: ${slug}`);
    return c;
  };

  // ── Categorías ──
  const musica = await prisma.category.create({
    data: { name: 'Música', slug: 'musica', description: 'Conciertos y festivales.' },
  });
  const teatro = await prisma.category.create({
    data: { name: 'Teatro', slug: 'teatro', description: 'Obras y artes escénicas.' },
  });
  const gastronomia = await prisma.category.create({
    data: { name: 'Gastronomía', slug: 'gastronomia', description: 'Ferias y eventos gastronómicos.' },
  });
  const animeManga = await prisma.category.create({
    data: { name: 'Anime y Manga', slug: 'anime-y-manga', description: 'Convenciones de cultura otaku.' },
  });
  const videojuegos = await prisma.category.create({
    data: { name: 'Videojuegos', slug: 'videojuegos', description: 'eSports y cultura gamer.' },
  });

  // ── Tags ──
  const rock    = await prisma.tag.create({ data: { name: 'Rock',    slug: 'rock'    } });
  const indie   = await prisma.tag.create({ data: { name: 'Indie',   slug: 'indie'   } });
  const cosplay = await prisma.tag.create({ data: { name: 'Cosplay', slug: 'cosplay' } });
  const gratis  = await prisma.tag.create({ data: { name: 'Gratis',  slug: 'gratis'  } });
  const familiar = await prisma.tag.create({ data: { name: 'Familiar', slug: 'familiar' } });
  const anime   = await prisma.tag.create({ data: { name: 'Anime',   slug: 'anime'   } });
  const manga   = await prisma.tag.create({ data: { name: 'Manga',   slug: 'manga'   } });
  const cine    = await prisma.tag.create({ data: { name: 'Cine',    slug: 'cine'    } });
  const gaming  = await prisma.tag.create({ data: { name: 'Gaming',  slug: 'gaming'  } });
  const kpop    = await prisma.tag.create({ data: { name: 'K-Pop',   slug: 'k-pop'   } });

  // ── Artículos ──
  await prisma.article.create({
    data: {
      title: 'Guía definitiva para tu primera convención de anime en Chile',
      slug: 'guia-primera-convencion-anime-chile',
      excerpt: 'Todo lo que necesitas saber: qué llevar, cómo vestirte, cómo moverte y cómo sacarle el máximo partido a tu primer evento otaku.',
      content: `Las convenciones de anime son mucho más que un punto de encuentro: son el lugar donde la cultura otaku chilena se hace visible, se celebra y crece. Si es tu primera vez asistiendo a una, el volumen de información, el ruido y la cantidad de personas puede resultar abrumadora. Esta guía existe para que llegues preparado y te vayas con la sensación de que fue uno de los mejores días del año.

**Antes del evento: planifica con tiempo**

Lo primero es revisar el programa oficial con al menos una semana de anticipación. Las convenciones grandes como la Expo Anime CCP o el Konbini Live Fest publican su parrilla de actividades — paneles, conciertos, concursos de cosplay, competencias de videojuegos — con varios días de antelación. Identifica las actividades que no te puedes perder y anota los horarios: los paneles con invitados especiales se llenan rápido y muchas veces tienen cupo limitado.

Si planeas ir de cosplay, empieza a prepararlo con semanas de anticipación. Los trajes de última hora se notan y, además de la incomodidad física, hay detalles que solo se ven bien cuando están terminados con calma. Revisa que el traje sea cómodo para estar de pie muchas horas, que puedas sentarte y que no impida ir al baño sin desmontarlo por completo — suena obvio pero es un error clásico.

**El día del evento: qué llevar**

El kit básico para una convención incluye: agua en botella reutilizable (la comida y bebida en recintos es cara), snacks que no ensucien, dinero en efectivo para las mesas de artistas y merchandising independiente (muchos vendedores no tienen POS), cargador portátil para el teléfono, y calzado cómodo. Vas a caminar entre seis y diez horas. Las zapatillas deportivas ganan siempre sobre las botas de cosplay en ese punto.

Si llevas una cámara o vas a fotografiar cosplayers, recuerda siempre pedir permiso antes de disparar. Es un estándar de respeto básico en la comunidad y la gran mayoría de los cosplayers agradece que les avises antes de que aparezcan en una foto en redes sociales.

**Dentro del evento**

Los primeros treinta minutos son caos. La entrada masiva de personas hace que las primeras filas sean lentas. Si quieres llegar a un panel específico, calcula llegar al recinto con media hora de anticipación. Una vez dentro, oriéntate con el mapa del evento — casi siempre está disponible en papel en la entrada o en la app oficial — y decide tu ruta según las actividades prioritarias.

Las mesas de artistas son una de las partes más interesantes: ahí encuentras prints, pins, llaveros y fanzines hechos por ilustradores y creadores locales. Es una oportunidad real de conocer el talento chileno y llevarte algo único que no está en ninguna tienda. Reserva algo de presupuesto para ese sector.

**Comunidad y respeto**

Las convenciones son espacios seguros para toda la comunidad. El acoso, el contacto físico no consentido y las fotos sin permiso están explícitamente prohibidos en todos los eventos bien organizados, y los staff están entrenados para actuar rápido si ocurre algo. Si ves algo fuera de lugar, reporta al personal del evento.

Finalmente, lo más importante: preséntate con disposición de disfrutar y conocer gente. La comunidad otaku chilena es acogedora, apasionada y tiene mucho que decir. Una conversación sobre tu serie favorita puede terminar en una nueva amistad que dure años.`,
      status: 'APPROVED',
      tags: { connect: [{ id: cosplay.id }, { id: anime.id }, { id: familiar.id }] },
    },
  });

  await prisma.article.create({
    data: {
      title: 'El manga chileno está creciendo: cinco autores locales que deberías conocer',
      slug: 'manga-chileno-autores-locales',
      excerpt: 'Una nueva generación de autores chilenos está publicando manga original con historias propias, mezclando el lenguaje visual japonés con referentes 100 % locales.',
      content: `Durante años, hablar de manga en Chile significaba hablar de importaciones: Shueisha, Kodansha, Shogakukan. Pero en la última década, y con más fuerza en los últimos tres años, ha emergido una escena de autores nacionales que están construyendo su propio camino dentro del lenguaje del manga, con historias que se desarrollan en poblaciones de Santiago, en el norte grande, en la Araucanía, con personajes que hablan como habla la gente en Chile.

**¿Qué hace a un manga "chileno"?**

La pregunta no tiene una sola respuesta. Algunos autores adoptan íntegramente las convenciones visuales del manga japonés — lectura de derecha a izquierda, tramas de cinco páginas, tipografía de onomatopeyas — pero ambientan sus historias en Chile y escriben desde experiencias chilenas. Otros mezclan el lenguaje del manga con el de los cómics latinoamericanos, creando algo más híbrido. Hay también quienes publican en formato occidental pero con una sensibilidad visual que viene claramente de la lectura de manga desde la infancia.

Lo que los une es la plataforma: gran parte de esta producción circula por Webtoon, Instagram, Itch.io y ferias de autoedición como la Feria de Cómic Alternativo de Santiago. El modelo no depende de editoriales grandes; depende de comunidades que siguen el trabajo de forma directa.

**Cinco nombres a seguir**

*Daniela Ortiz* lleva tres años publicando "Altura Cordillerana", una historia de aventuras que sigue a una joven quechua que descubre que su abuela fue parte de una sociedad secreta de guardianas de las montañas. El trazo es limpio, la composición de página es sólida y la investigación etnográfica que hay detrás de cada capítulo es notable.

*Felipe Contreras* publica "Línea 4", un thriller urbano ambientado en el metro de Santiago. Sus páginas tienen una densidad de detalle arquitectónico que hace que la ciudad se sienta real de una forma que pocas obras logran. Actualmente está en el capítulo 28 y tiene más de doce mil seguidores en Webtoon.

*Carolina Vega* es probablemente la más conocida fuera de Chile dentro de esta lista: su obra "Polvo de Sal" ganó el primer lugar en el concurso de Webtoon Canvas en la categoría romance y acumula más de cien mil suscriptores. La historia, ambientada en Valparaíso, mezcla romance con elementos de fantasía marina.

*Rodrigo Tapia* lleva años publicando de forma más irregular pero con una calidad gráfica que lo pone en otra categoría. Su miniserie "Bajo el Cobre", sobre un minero del norte que descubre algo sobrenatural en el yacimiento donde trabaja, es uno de los trabajos más ambiciosos de la escena local.

*Valentina Méndez* es la más joven de este listado y lleva apenas un año publicando, pero "Ñu Rayen" — nombre mapuche que significa flor negra — ya tiene una base de lectores fieles y una calidad de dibujo que no parece de alguien que recién empieza.

**Dónde encontrarlos**

La mayoría tiene presencia en Instagram bajo su nombre o el título de su obra. La Feria de Cómic Alternativo, que se realiza anualmente en el Parque de los Reyes de Santiago, es el lugar físico donde muchos venden sus fanzines y ediciones físicas de sus trabajos. También vale la pena revisar el catálogo de Webtoon Chile y el grupo de Facebook "Manga Chileno" donde los propios autores comparten sus novedades.`,
      status: 'APPROVED',
      tags: { connect: [{ id: manga.id }, { id: anime.id }] },
    },
  });

  await prisma.article.create({
    data: {
      title: 'Cine de animación japonesa en pantalla grande: las películas de Studio Ghibli que regresan a Chile',
      slug: 'ghibli-cine-pantalla-grande-chile',
      excerpt: 'Varias obras del estudio fundado por Hayao Miyazaki y Isao Takahata están programadas para funciones especiales en cines de Santiago y regiones.',
      content: `Hay algo que pasa con el cine de Studio Ghibli en pantalla grande que no ocurre ni siquiera en el televisor más grande del mundo: la sala oscura, el audio envolvente y la escala de la imagen amplifican la experiencia de una manera que parece hacer justicia a lo que Miyazaki y sus colaboradores diseñaron originalmente. Para quienes solo conocen estas películas en streaming o en DVD, verlas en cine por primera vez es, en el mejor sentido posible, una revelación.

**El regreso de Ghibli a las salas chilenas**

Desde que GKIDS adquirió los derechos de distribución internacional del catálogo de Studio Ghibli, las funciones especiales en cines de distintos países se han vuelto más frecuentes. Chile no ha sido la excepción: en los últimos dos años, obras como "Mi vecino Totoro", "El viaje de Chihiro", "La princesa Mononoke" y "El viento se levanta" han tenido funciones limitadas en el Cine Arte Alameda y en algunas salas de Cinemark y CinePlanet que programan ciclos de animación.

La demanda ha superado consistentemente la oferta. Las entradas para estas funciones se agotan en horas, lo que ha llevado a algunas distribuidoras locales a negociar fechas adicionales. El fenómeno refleja algo interesante: el público chileno que creció viendo Ghibli en VHS o en canal 13 a fines de los noventa y principios de los 2000 ahora tiene entre 25 y 40 años, tiene dinero para ir al cine y quiere vivir esas películas en el formato que merecen.

**Las más esperadas**

"El viaje de Chihiro" sigue siendo la película más convocante. Ganadora del Oscar a Mejor Película de Animación en 2003, es también la cinta más taquillera de la historia en Japón. Su regreso a la pantalla grande siempre genera cola. "La princesa Mononoke", más oscura y dirigida a un público adulto, tiene una base de fans igualmente apasionada.

Pero hay algo especial en ver "Nausicaä del Valle del Viento" o "El castillo en el cielo" — las obras más antiguas del catálogo — en cine. La animación de los años ochenta tiene una textura y un ritmo que el digital no puede replicar, y en pantalla grande esa diferencia se vuelve parte del encanto.

**Cómo enterarse de las funciones**

La forma más confiable de estar al tanto es seguir las redes sociales del Cine Arte Alameda y del Centro Arte Alameda, que son los espacios que con más frecuencia programan cine de animación en Santiago. También vale la pena revisar la cartelera de Cineclub de la Cineteca Nacional. Fuera de Santiago, los Centros Culturales de Viña del Mar, Concepción y Valparaíso suelen programar ciclos similares, aunque con menor frecuencia.

Si quieres ir acompañado, compra las entradas en cuanto se abra la venta — usualmente entre cinco y diez días antes de la función. No hay segunda oportunidad.

**La experiencia colectiva**

Una de las cosas más particulares de ver Ghibli en el cine es el público. No es el silencio tenso de un thriller; es una sala que ríe junta, que se emociona junta, en la que de vez en cuando escuchas a alguien susurrar una línea de diálogo que sabe de memoria. Esa experiencia compartida es algo que el streaming, con todo lo que tiene a favor, no puede ofrecer.`,
      status: 'APPROVED',
      tags: { connect: [{ id: cine.id }, { id: anime.id }] },
    },
  });

  await prisma.article.create({
    data: {
      title: 'Gaming en Chile 2025: el año en que los torneos locales dejaron de ser underground',
      slug: 'gaming-chile-2025-torneos-locales',
      excerpt: 'Desde Valorant hasta Street Fighter 6, los torneos presenciales de videojuegos en Chile están atrayendo más público, más sponsors y más cobertura que nunca.',
      content: `Hace cinco años, hablar de esports y gaming competitivo en Chile era hablar de un fenómeno de nicho: torneos organizados en cafés internet, transmisiones de Twitch con 200 espectadores, y premios que apenas cubrían el pasaje al evento. En 2025, el panorama es otro. Los torneos presenciales más grandes convocan miles de personas, tienen transmisiones en vivo con producción comparable a la de canales de televisión, y algunos de los jugadores más destacados ya tienen contratos con organizaciones que les permiten vivir del juego.

**El salto de los FPS**

El género que más ha crecido en la escena competitiva chilena es el de los shooters tácticos, encabezados por Valorant. El torneo Konbini Gaming Cup, que tuvo su primera edición en 2024 con apenas ocho equipos, creció a 32 equipos para su segunda versión y superó las cuatro mil personas en el recinto durante el día final. La final se transmitió simultáneamente por Twitch y YouTube, alcanzando un peak de 18 mil espectadores concurrentes — un número que habría parecido imposible hace pocos años.

Riot Games, desarrolladora de Valorant y League of Legends, ha puesto ojo en el mercado latinoamericano y Chile forma parte de esa mirada. La creación de la liga VCT Americas, con equipos de toda la región, ha generado un efecto de atención hacia los jugadores chilenos: quienes destacan en torneos locales entran en el radar de organizaciones que buscan talento para sus academias.

**Street Fighter 6 y la escena de peleas**

Los juegos de pelea tienen una historia competitiva en Chile que precede por mucho al boom actual. La escena de Street Fighter, Tekken y King of Fighters lleva décadas organizándose de forma autónoma, y ese capital social y organizacional les ha permitido adaptarse bien a la nueva era. El torneo Furia Callejera, que se realiza en Santiago dos veces al año, es ahora uno de los torneos de Street Fighter 6 más grandes de Sudamérica en términos de participantes. La edición de mayo de 2025 tuvo 340 competidores de seis países.

**El desafío de la infraestructura**

El crecimiento viene acompañado de desafíos concretos. La conectividad sigue siendo un problema: organizar torneos online con jugadores de distintas regiones del país implica lidiar con diferencias de latencia que afectan la experiencia competitiva. Los recintos con infraestructura adecuada para albergar torneos grandes están concentrados en Santiago, lo que limita el acceso de jugadores de regiones que tienen que costear traslado y alojamiento para participar.

Las organizaciones más maduras del ecosistema están empezando a trabajar en esto: algunas han establecido nodos regionales en Concepción y Valparaíso donde se realizan clasificatorias locales antes de la final en Santiago. Es un modelo que distribuye mejor el acceso, aunque todavía limitado.

**La profesionalización como horizonte**

El jugador promedio de la escena chilena sigue siendo alguien que estudia o trabaja y compite los fines de semana. Pero hay un grupo pequeño — tal vez veinte o treinta personas en todo el país — que ya está viviendo de esto: con salario de organización, streaming como fuente de ingreso complementario, y auspicios de marcas de periféricos y ropa deportiva.

Ese número va a crecer. La pregunta es si el ecosistema de apoyo — organizaciones serias, sponsors que entiendan el mercado, medios que cubran la escena — crece a la misma velocidad.`,
      status: 'APPROVED',
      tags: { connect: [{ id: gaming.id }, { id: gratis.id }] },
    },
  });

  await prisma.article.create({
    data: {
      title: 'K-Pop en Chile: cómo la comunidad local construyó una escena sin esperar a las grandes disqueras',
      slug: 'kpop-chile-comunidad-local-escena',
      excerpt: 'Antes de que cualquier artista coreano llegara al país, los fans chilenos ya organizaban eventos propios y construían redes que hoy tienen miles de miembros.',
      content: `En 2009, ver un video de K-Pop en Chile requería buscar activamente en foros de internet, descargar archivos de YouTube en calidad 360p y compartirlos en CD con los pocos amigos que entendían de qué hablabas. Hoy, Chile es uno de los países de América Latina con mayor densidad de fandoms organizados de K-Pop, y Santiago ha recibido en los últimos cinco años a artistas de la talla de BTS, BLACKPINK, TWICE, EXO y Stray Kids — en algunos casos antes que ciudades europeas.

**El origen de la escena chilena**

Los primeros grupos organizados de fans en Chile datan de principios de los 2000, impulsados principalmente por el drama coreano y la música que lo acompañaba. El K-Pop tal como lo conocemos hoy — con las coreografías precisas, la producción visual elaborada y el sistema de ídolos — llegó de la mano de grupos como Super Junior, TVXQ y Girls' Generation, y encontró en Chile un terreno fértil.

La razón tiene varias capas. Chile tiene una infraestructura de internet que permitió la masificación del consumo de contenido asiático antes que otros países de la región. También tiene una tradición de fandoms organizados en torno a la música popular —el rock nacional, la cumbia— que se trasladó sin demasiado esfuerzo al K-Pop. Y hay un componente de identidad: la cultura coreana, con su énfasis en la presentación, el trabajo en equipo y la narrativa de superación, conectó con algo en la sensibilidad chilena.

**Eventos antes de los conciertos oficiales**

La particularidad de la comunidad K-Pop chilena es que construyó una escena de eventos mucho antes de que las disqueras y promotoras internacionales pusieran atención en el país. Las "fanmeeting nights", los cover dance competitions y los eventos de screening de comebacks se organizaban —y se siguen organizando— de forma autogestionada, con recursos recaudados entre los propios fans.

Estos eventos no son improvisados: los más grandes tienen producción profesional, sistemas de sonido de calidad, seguridad, y carteleras con grupos de cover dance de alto nivel. El evento "Santiago K-Fest", que se realiza en el Movistar Arena de forma independiente, convoca entre cinco mil y ocho mil personas y tiene un nivel de organización que muchas promotoras profesionales envidiarían.

**El boom de los conciertos oficiales**

El primer concierto oficial de un artista K-Pop de primer nivel en Chile fue el de Super Junior en 2013. Desde entonces, la oferta no ha hecho más que crecer. Los años 2023 y 2024 fueron especialmente intensos: más de quince artistas o grupos visitaron el país en giras oficiales, con estadios vendidos en pocas horas y con un público que demuestra un nivel de conocimiento y de preparación — con los fan chants en coreano memorizados, con los lightsticks del color correspondiente — que impresiona a los propios artistas.

Varios de esos artistas han mencionado públicamente a Chile como uno de los públicos más apasionados de sus giras latinoamericanas. Eso no es accidental: es el resultado de décadas de comunidad construyendo algo que ahora es visible.

**La escena local de cover dance**

Una de las expresiones más interesantes del K-Pop chileno es la comunidad de cover dance: grupos que ensayan durante meses las coreografías de sus artistas favoritos y las presentan en competencias y eventos. El nivel técnico ha crecido enormemente en los últimos años, y hay grupos chilenos que participan en competencias internacionales en Corea del Sur con resultados destacados.

Esta escena tiene su propio circuito: estudios de danza que ofrecen clases específicas de K-Pop, competencias que se realizan en teatros y centros culturales, y una red de entrenadores muchos de los cuales aprendieron de forma autodidacta viendo los videos de práctica de los propios artistas.`,
      status: 'APPROVED',
      tags: { connect: [{ id: kpop.id }, { id: familiar.id }] },
    },
  });

  await prisma.article.create({
    data: {
      title: 'El arte del cosplay en Chile: entre la artesanía, la comunidad y la identidad',
      slug: 'arte-cosplay-chile-artesania-comunidad',
      excerpt: 'Para los cosplayers chilenos, el traje es solo el inicio: hay meses de trabajo artesanal, investigación y una red de apoyo que va mucho más allá del evento.',
      content: `El cosplay, en su forma más superficial, es disfrazarse de un personaje. Pero quienes lo practican con seriedad en Chile saben que esa definición no alcanza para describir lo que hacen: investigar materiales, aprender técnicas de moldería, trabajar con EVA, termoplástico, resina y masilla; estudiar a los personajes con un nivel de detalle que a veces supera al del fandom promedio. El resultado, cuando sale bien, es una pieza de arte que tarda meses en construirse.

**Quiénes son los cosplayers chilenos**

La comunidad cosplay chilena es heterogénea. Hay estudiantes universitarios que hacen sus primeros trajes con presupuesto mínimo y mucha creatividad, cosplayers veteranos con talleres en su casa y herramientas especializadas, y un grupo más pequeño pero creciente de cosplayers que ya generan ingresos con su trabajo — a través de comisiones, de contenido en Patreon, o de presentaciones pagadas en eventos corporativos y lanzamientos de productos.

Lo que los une es el proceso: todos pasan por la misma secuencia de investigación, diseño, prototipado, fallo y corrección que caracteriza cualquier oficio artesanal. Y todos han aprendido, en algún punto, que el cosplay es más fácil —y más divertido— cuando hay comunidad alrededor.

**La red de talleres y conocimiento**

Una de las características más llamativas de la escena cosplay chilena es la generosidad con el conocimiento. Los cosplayers más experimentados comparten tutoriales en Instagram y YouTube, organizan talleres en sus casas o en espacios comunitarios, y responden preguntas de principiantes en grupos de Facebook y Discord con una paciencia que sorprende a quienes llegan desde otras comunidades de internet.

Esta cultura de apertura tiene una razón práctica: el crecimiento del nivel técnico general beneficia a todos. Cuando el promedio sube, las competencias en convenciones son más interesantes, los eventos tienen más espectáculo y la escena se vuelve más visible para organizadores y sponsors.

**Las competencias: el Masquerade**

El punto álgido del año para muchos cosplayers es el Masquerade, el concurso de cosplay que se realiza en las convenciones grandes. El formato varía: algunos incluyen solo presentación estática, otros incluyen performance en escenario con coreografía o sketch dramático. Las categorías suelen separar a principiantes, intermedios y maestros, y los criterios de evaluación incluyen precisión del traje, calidad de construcción y caracterización del personaje.

Ganar el Masquerade de una convención grande en Chile tiene un peso real en la comunidad: abre puertas a invitaciones a eventos internacionales, a ser jurado en otros concursos, y en algunos casos a contratos con firmas de cosplay.

**Cosplay y salud mental**

Un aspecto que se habla cada vez más abiertamente en la comunidad es el vínculo entre cosplay y bienestar emocional. Para muchos practicantes, el proceso de construir un traje es una forma de meditación activa — un trabajo manual que desconecta del ruido cotidiano. Para otros, ponerse el traje de un personaje es una forma de explorar aspectos de su identidad que en la vida diaria no tienen espacio.

Las convenciones, con todo el caos que tienen, son también espacios donde mucha gente que se siente fuera de lugar en su entorno habitual encuentra gente con la que conectar. Eso no es algo menor, y la comunidad cosplay chilena lo sabe y lo cuida.

**El desafío económico**

Hacer cosplay cuesta dinero. Un traje de mediana complejidad puede requerir entre cincuenta mil y doscientos mil pesos solo en materiales, sin contar las horas de trabajo. Para cosplayers con presupuesto limitado, esto implica elegir bien los proyectos, aprender a sustituir materiales caros por alternativas más accesibles, y a veces esperar meses para tener el dinero necesario para completar un traje.

Esta realidad ha impulsado el desarrollo de un mercado informal pero activo de venta y alquiler de piezas entre cosplayers, y de grupos de compra conjunta de materiales importados que no se consiguen en Chile o que son significativamente más baratos al pedirlos al por mayor.`,
      status: 'APPROVED',
      tags: { connect: [{ id: cosplay.id }, { id: anime.id }] },
    },
  });

  await prisma.article.create({
    data: {
      title: 'Reseña: "Dungeon Meshi" y por qué es el mejor manga de los últimos diez años',
      slug: 'resena-dungeon-meshi-mejor-manga',
      excerpt: 'Ryoko Kui construyó algo que parecía imposible: comedia de cocina, ecología fantástica y uno de los estudios de personajes más profundos del manga contemporáneo.',
      content: `Cuando "Dungeon Meshi" —publicado en español bajo el nombre "Delicias de mazmorra" por Norma Editorial— terminó en 2023 después de nueve años de serialización, dejó un vacío que es difícil de describir. No porque sea una obra perfecta —tiene sus imperfecciones— sino porque hacía cosas que nadie más estaba haciendo, y las hacía con una calma y una confianza en el lector que se ha vuelto rara en el manga contemporáneo.

**El argumento en superficie**

Un grupo de aventureros debe descender a un calabozo para rescatar a una de los suyos, que fue devorada por un dragón al final de una expedición que salió muy mal. El problema: perdieron todo su dinero y provisiones en la huida, y no tienen recursos para comprar comida. La solución que propone Laios, el líder del grupo: comer a los monstruos que van eliminando en el camino.

Eso es todo. Ese es el punto de partida de una obra que en sus primeros capítulos parece una comedia de situación, pero que va construyendo, capa por capa, algo de una profundidad y una coherencia internas que pocas obras alcanzan.

**Por qué la comida importa**

La gran apuesta de Ryoko Kui es tratar la comida como un sistema de conocimiento del mundo. Cada monstruo que el grupo cocina implica investigar su biología, su hábitat, su comportamiento: qué come, cómo digiere, de qué se nutre. Con ese punto de partida, la autora construye una ecología completa del mundo del calabozo que se va revelando de forma gradual y que tiene una lógica interna impecable.

Lo que parece una excusa para hacer chistes sobre cocinar monstruos resulta ser la base de una reflexión seria sobre los ciclos de vida, la cadena alimentaria, la relación entre predadores y presas, y finalmente sobre qué significa que los humanos estén en la cima de esa cadena y qué responsabilidad conlleva esa posición.

**Los personajes como el corazón de todo**

Pero lo que hace verdaderamente grande a "Dungeon Meshi" son sus personajes. Laios, el protagonista, es uno de los héroes más originales del manga en décadas: un hombre obsesionado con los monstruos hasta un grado que resulta inquietante para su propio grupo, socialmente torpe, genuinamente buena persona, y con una arco de personaje que se resuelve de una manera que en retrospectiva parece inevitable pero que en el momento sorprende.

Marcille, la elfa maga del grupo, parece al principio el arquetipo de la compañera quejumbrosa. Pero la historia le dedica un cuidado extraordinario: su relación con su propia naturaleza (los elfos viven mucho más que los humanos, y eso tiene un costo emocional enorme), su historia familiar, sus miedos y sus contradicciones son tratados con una honestidad que no es común.

Chilchuck, el medio-pie encargado de las trampas, es quizás el personaje más sorprendente: parece un personaje de soporte cómico durante los primeros volúmenes, pero resulta ser uno de los personajes más complejos y con el pasado más cargado de toda la obra.

**La pregunta final**

En su tramo final, "Dungeon Meshi" hace algo que pocas obras de fantasía se atreven a hacer: cuestiona el marco moral en el que opera desde el principio. La pregunta no es si el protagonista va a salvar a su hermana —eso es dado— sino a qué costo, y si ese costo es justificable, y quién tiene derecho a decidirlo. La respuesta que propone Kui no es cómoda, pero es honesta.

Si no has leído "Dungeon Meshi", empieza por el primer volumen. Si lo has visto solo en la adaptación de Studio Trigger —que es excelente— lee el manga de todas formas: hay capas de detalle y de humor seco que la animación no puede capturar del todo.`,
      status: 'APPROVED',
      tags: { connect: [{ id: manga.id }, { id: anime.id }] },
    },
  });

  await prisma.article.create({
    data: {
      title: 'Las mejores salas de arcade y gaming retro de Santiago: guía actualizada 2025',
      slug: 'mejores-salas-arcade-gaming-retro-santiago-2025',
      excerpt: 'Santiago tiene una escena de arcades y gaming retro más activa de lo que parece. Aquí están los mejores lugares para jugar máquinas clásicas, flippers y consolas de época.',
      content: `El arcade, como espacio físico, parecía condenado a desaparecer con la llegada de las consolas domésticas de quinta generación. Que en 2025 exista no solo una sino varias salas de arcade en Santiago, con máquinas en buen estado y comunidades activas alrededor de ellas, es algo que merece reconocimiento y, sobre todo, que la gente sepa que existen.

**Por qué el arcade sobrevivió**

Parte de la respuesta es la nostalgia: hay una generación de chilenos que creció jugando en salones de máquinas en los centros comerciales de los años noventa, y que ahora tiene el dinero y las ganas de revivir esa experiencia. Pero reducir el fenómeno a nostalgia es quedarse corto. Los mejores arcades de Santiago tienen clientela joven —menores de 25 años— que no vivió esa era y que se acerca al arcade como una experiencia diferente, táctil y social, que los videojuegos en pantalla no ofrecen.

Los juegos de ritmo japoneses —Dance Dance Revolution, Pop'n Music, Sound Voltex, Taiko no Tatsujin— son el gran motor del arcade contemporáneo. Generan comunidades de práctica muy activas, tienen curvas de aprendizaje que pueden durar años, y la experiencia de jugarlos en una máquina física con los pedales o los botones originales es fundamentalmente distinta a emularlos en casa.

**Pixel District (Providencia)**

El espacio más conocido de la escena. Tiene una colección de más de cuarenta máquinas que incluye clásicos de los ochenta y noventa —Street Fighter II, Metal Slug, Tekken 3, CPS2— y varias máquinas de ritmo actualizadas regularmente. El ambiente es de bar con poca luz y mucho ruido, lo que para algunos es perfecto y para otros puede resultar cansador. Los viernes y sábados en la noche hay torneos improvisados de Street Fighter que generan bastante espectáculo.

**Retro Game Club (Ñuñoa)**

Más orientado a consolas que a arcade puro. Tienen estaciones de juego con Super Nintendo, N64, PlayStation 1 y 2, Dreamcast y algunas consolas más raras como PC Engine y Neo Geo. El precio de entrada da acceso libre durante toda la sesión, lo que lo hace especialmente bueno para quienes quieren explorar catálogos que de otra forma serían inaccesibles. Los dueños son coleccionistas serios y se nota en el estado de los equipos.

**Kabuki Arcade (Santiago Centro)**

Especializado en juegos de ritmo japoneses. Tienen máquinas de Dance Dance Revolution actualizadas a las últimas versiones, Sound Voltex, maimai, Chunithm y una de las pocas máquinas de beatmania IIDX en Chile. Es el punto de encuentro de la comunidad de juegos de ritmo santiaguina y los fines de semana el ambiente es de club de práctica informal: gente que se conoce, que se muestra los avances, que celebra cuando alguien pasa un chart difícil.

**Los flippers**

Mención especial para los flippers o pinball, que tienen su propia escena. El Bar Flipper, en Barrio Italia, tiene quince máquinas en funcionamiento, desde modelos de los años setenta hasta máquinas modernas de Stern. El mantenimiento es el desafío principal de cualquier sala de pinball —las máquinas son mecánicas y se rompen— y aquí lo hacen bien.

**Consejos prácticos**

Lleva efectivo: la mayoría de estas salas operan con fichas o tokens que se compran en efectivo. Ve en horarios de semana si quieres máquinas disponibles sin esperar; los fines de semana están llenas. Si vas a juegos de ritmo por primera vez, no te frustres en los primeros intentos: la curva inicial es empinada pero el punto donde empieza a ser divertido llega antes de lo que parece.`,
      status: 'APPROVED',
      tags: { connect: [{ id: gaming.id }, { id: anime.id }] },
    },
  });

  // ── Usuarios (sistema local; un usuario por cada rol) ──
  const passwordHash = await hash('konbini123', 10);
  await prisma.user.create({
    data: {
      email: 'superadmin@konbini.cl',
      passwordHash,
      firstname: 'Super',
      lastname: 'Admin',
      role: 'SUPER_ADMIN',
      confirmed: true,
    },
  });
  const admin = await prisma.user.create({
    data: {
      email: 'admin@konbini.cl',
      passwordHash,
      firstname: 'Equipo',
      lastname: 'Konbini',
      role: 'ADMIN',
      confirmed: true,
    },
  });
  const organizer = await prisma.user.create({
    data: {
      email: 'organizador@konbini.cl',
      passwordHash,
      firstname: 'Camila',
      lastname: 'Rojas',
      rut: '12.345.678-9',
      isCompany: false,
      role: 'AUTHENTICATED',
      confirmed: true,
    },
  });

  // ── Spots: paid ads shown among the event cards (created after the owner user) ──
  await prisma.spot.createMany({
    data: [
      {
        title: 'Arrienda tu local para eventos',
        image: 'https://placehold.co/600x300/png',
        linkType: 'URL',
        linkValue: 'https://example.cl/arriendo-de-locales',
        expirationDate: new Date('2026-12-31'),
        status: 'APPROVED',
        userId: organizer.id,
      },
      {
        title: 'Sonido e iluminación — llámanos',
        linkType: 'PHONE',
        linkValue: '+56912345678',
        expirationDate: new Date('2026-11-30'),
        status: 'APPROVED',
        userId: organizer.id,
      },
      {
        title: 'Cotiza tu stand para convenciones',
        image: 'https://placehold.co/600x300/png',
        linkType: 'EMAIL',
        linkValue: 'ventas@example.cl',
        status: 'APPROVED',
        userId: organizer.id,
      },
    ],
  });

  // ── Heroes: paid placements shown in the home hero carousel ──
  await prisma.hero.createMany({
    data: [
      {
        title: 'Festival de',
        titleAccent: 'Primavera 2026',
        lead: 'Dos días de música en vivo en el corazón de Santiago.',
        image: '/uploads/hero-1.jpg',
        date: new Date('2026-09-21'),
        place: "Parque O'Higgins, Santiago",
        link: 'https://example.cl/festival-de-primavera',
        categoryId: musica.id,
        userId: organizer.id,
        status: 'APPROVED',
        days: 30,
        amount: 30 * 15000,
        expirationDate: new Date('2026-09-22'),
      },
      {
        title: 'Expo Otaku',
        titleAccent: 'Viña 2026',
        lead: 'La convención otaku más grande de la región.',
        image: '/uploads/hero-2.jpg',
        date: new Date('2026-10-12'),
        place: 'Centro de Convenciones, Viña del Mar',
        link: 'https://example.cl/expo-otaku-vina',
        categoryId: animeManga.id,
        userId: organizer.id,
        status: 'APPROVED',
        days: 30,
        amount: 30 * 15000,
        expirationDate: new Date('2026-10-13'),
      },
    ],
  });

  // ── Eventos (con componentes) ──
  // Imágenes alojadas en la API: apps/api/uploads/poster-N.jpg y banner-N.jpg,
  // servidas en /uploads/. El campo del evento guarda la ruta relativa.
  const catId: Record<string, number> = {
    musica: musica.id,
    teatro: teatro.id,
    gastronomia: gastronomia.id,
    anime: animeManga.id,
    videojuegos: videojuegos.id,
  };

  type SeedEvent = {
    title: string;
    company: string;
    description: string;
    about?: string;
    expirationDate: string;
    address: string;
    addressNumber: string;
    ticketUrl?: string;
    cats: string[];
    citySlug: string;
    approved: boolean;
    prices: { name: string; price: number }[];
    dates: { date: string; startTime: string; endTime: string }[];
    socials?: string[];
    videos?: string[];
    img: number; // índice de /uploads/poster-N.jpg y /uploads/banner-N.jpg
  };

  const eventsData: SeedEvent[] = [
    {
      title: 'Konbini Live Fest',
      company: 'Konbini Producciones',
      description: 'Festival de bandas indie y rock nacional con dos escenarios.',
      about: 'Una jornada completa con más de diez bandas en vivo.',
      expirationDate: '2026-11-15',
      address: 'Av. Matta', addressNumber: '890',
      ticketUrl: 'https://entradas.example.cl/konbini-live-fest',
      cats: ['musica'], citySlug: 'santiago',
      approved: true, img: 1,
      prices: [
        { name: 'Entrada general', price: 15000 },
        { name: 'Entrada VIP', price: 35000 },
      ],
      dates: [{ date: '2026-11-14', startTime: '18:00', endTime: '23:30' }],
      socials: ['https://instagram.com/konbinilivefest'],
      videos: ['https://youtube.com/watch?v=konbini-live'],
    },
    {
      title: 'Expo Anime Concepción',
      company: 'Otaku Sur SpA',
      description: 'Convención de anime, manga y videojuegos en el Biobío.',
      about: 'Concursos de cosplay, zona gamer y artistas invitados.',
      expirationDate: '2026-10-20',
      address: 'Barros Arana', addressNumber: '321',
      ticketUrl: 'https://entradas.example.cl/expo-anime-concepcion',
      cats: ['anime', 'videojuegos'], citySlug: 'concepcion',
      approved: true, img: 2,
      prices: [{ name: 'Entrada por día', price: 8000 }],
      dates: [
        { date: '2026-10-18', startTime: '10:00', endTime: '20:00' },
        { date: '2026-10-19', startTime: '10:00', endTime: '20:00' },
      ],
      socials: ['https://instagram.com/expoanimeccp'],
    },
    {
      title: 'Festival J-Rock Santiago',
      company: 'Rising Sun Live',
      description: 'Lo mejor del rock japonés en una noche con bandas invitadas.',
      about: 'Tributo y bandas originales de J-Rock y visual kei.',
      expirationDate: '2026-09-13',
      address: 'Av. Providencia', addressNumber: '2594',
      ticketUrl: 'https://entradas.example.cl/festival-j-rock-santiago',
      cats: ['musica'], citySlug: 'providencia',
      approved: true, img: 3,
      prices: [{ name: 'Entrada general', price: 22000 }],
      dates: [{ date: '2026-09-12', startTime: '19:00', endTime: '23:00' }],
      socials: ['https://instagram.com/jrockstgo'],
    },
    {
      title: 'Convención Cosplay Valparaíso',
      company: 'Puerto Geek',
      description: 'Concurso de cosplay, talleres y feria de artistas en el puerto.',
      about: 'Pasarela principal, jueces invitados y zona de fotografía.',
      expirationDate: '2026-08-23',
      address: 'Plaza Sotomayor', addressNumber: '233',
      ticketUrl: 'https://entradas.example.cl/convencion-cosplay-valparaiso',
      cats: ['anime'], citySlug: 'valparaiso',
      approved: true, img: 4,
      prices: [
        { name: 'Entrada general', price: 12000 },
        { name: 'Pase día completo', price: 18000 },
      ],
      dates: [{ date: '2026-08-22', startTime: '11:00', endTime: '21:00' }],
      socials: ['https://instagram.com/puertogeek'],
    },
    {
      title: 'eSports Konbini Cup',
      company: 'Konbini Gaming',
      description: 'Torneo de eSports con competencias de varios títulos.',
      about: 'Fase de grupos, playoffs y gran final con premios.',
      expirationDate: '2026-07-27',
      address: 'Av. Apoquindo', addressNumber: '4500',
      ticketUrl: 'https://entradas.example.cl/esports-konbini-cup',
      cats: ['videojuegos'], citySlug: 'las-condes',
      approved: true, img: 5,
      prices: [{ name: 'Entrada general', price: 10000 }],
      dates: [
        { date: '2026-07-25', startTime: '09:00', endTime: '22:00' },
        { date: '2026-07-26', startTime: '09:00', endTime: '22:00' },
      ],
      socials: ['https://instagram.com/konbinigaming'],
    },
    {
      title: 'Anime Sinfónico en Vivo',
      company: 'Orquesta Geek',
      description: 'Las bandas sonoras del anime interpretadas por orquesta.',
      about: 'Un repertorio de clásicos del anime con orquesta completa.',
      expirationDate: '2026-10-04',
      address: 'Av. Matucana', addressNumber: '100',
      ticketUrl: 'https://entradas.example.cl/anime-sinfonico-en-vivo',
      cats: ['musica', 'teatro'], citySlug: 'santiago',
      approved: true, img: 6,
      prices: [
        { name: 'Platea', price: 28000 },
        { name: 'Palco', price: 45000 },
      ],
      dates: [{ date: '2026-10-03', startTime: '20:00', endTime: '22:30' }],
      socials: ['https://instagram.com/orquestageek'],
    },
    {
      title: 'Maratón de Cine Animado',
      company: 'Cine Club Otaku',
      description: 'Una jornada de proyecciones de cine animado en pantalla grande.',
      about: 'Selección de películas animadas con foro entre funciones.',
      expirationDate: '2026-09-28',
      address: 'Av. San Martín', addressNumber: '880',
      ticketUrl: 'https://entradas.example.cl/maraton-de-cine-animado',
      cats: ['teatro'], citySlug: 'vina-del-mar',
      approved: true, img: 7,
      prices: [{ name: 'Entrada', price: 6000 }],
      dates: [{ date: '2026-09-27', startTime: '14:00', endTime: '23:00' }],
    },
    {
      title: 'Expo Manga Antofagasta',
      company: 'Norte Otaku',
      description: 'Feria del manga con editoriales, autores y firma de ejemplares.',
      about: 'Stands de editoriales, charlas y zona de ilustradores.',
      expirationDate: '2026-11-08',
      address: 'Av. Argentina', addressNumber: '1962',
      ticketUrl: 'https://entradas.example.cl/expo-manga-antofagasta',
      cats: ['anime'], citySlug: 'antofagasta',
      approved: true, img: 8,
      prices: [{ name: 'Entrada por día', price: 7000 }],
      dates: [{ date: '2026-11-07', startTime: '10:00', endTime: '19:00' }],
      socials: ['https://instagram.com/norteotaku'],
    },
    {
      title: 'Feria Retro Gaming',
      company: 'Pixel Club',
      description: 'Consolas clásicas, arcades y venta de videojuegos retro.',
      about: 'Zona de arcades libres, torneos casuales y feria de coleccionismo.',
      expirationDate: '2026-08-10',
      address: 'Av. Irarrázaval', addressNumber: '3700',
      ticketUrl: 'https://entradas.example.cl/feria-retro-gaming',
      cats: ['videojuegos'], citySlug: 'nunoa',
      approved: true, img: 9,
      prices: [{ name: 'Entrada general', price: 5000 }],
      dates: [{ date: '2026-08-09', startTime: '12:00', endTime: '20:00' }],
    },
    {
      title: 'Mercado Geek Gastronómico',
      company: 'Sabores Otaku',
      description: 'Food trucks de cocina japonesa y feria geek al aire libre.',
      about: 'Cocina temática, food trucks y stands de artistas.',
      expirationDate: '2026-12-07',
      address: 'Parque Bustamante', addressNumber: 's/n',
      cats: ['gastronomia', 'anime'], citySlug: 'santiago',
      approved: true, img: 10,
      prices: [{ name: 'Acceso liberado', price: 0 }],
      dates: [{ date: '2026-12-06', startTime: '12:00', endTime: '22:00' }],
    },
    {
      title: 'Teatro Kabuki Contemporáneo',
      company: 'Compañía Hanami',
      description: 'Una puesta en escena que reinterpreta el teatro kabuki.',
      about: 'Vestuario tradicional y narrativa contemporánea.',
      expirationDate: '2026-09-20',
      address: 'Av. Francisco de Aguirre', addressNumber: '210',
      ticketUrl: 'https://entradas.example.cl/teatro-kabuki-contemporaneo',
      cats: ['teatro'], citySlug: 'la-serena',
      approved: true, img: 11,
      prices: [{ name: 'Entrada general', price: 14000 }],
      dates: [{ date: '2026-09-19', startTime: '20:00', endTime: '22:00' }],
    },
    {
      title: 'Encuentro Otaku Temuco',
      company: 'Sur Geek',
      description: 'Encuentro de la comunidad otaku del sur con feria y concursos.',
      about: 'Concurso de cosplay, karaoke japonés y feria de fanzines.',
      expirationDate: '2026-11-22',
      address: 'Av. Alemania', addressNumber: '0671',
      ticketUrl: 'https://entradas.example.cl/encuentro-otaku-temuco',
      cats: ['anime'], citySlug: 'temuco',
      approved: false, img: 12,
      prices: [{ name: 'Entrada general', price: 6000 }],
      dates: [{ date: '2026-11-21', startTime: '11:00', endTime: '20:00' }],
      socials: ['https://instagram.com/surgeek'],
    },
  ];

  for (const ev of eventsData) {
    await prisma.event.create({
      data: {
        title: ev.title,
        company: ev.company,
        slug: slugify(ev.title),
        description: ev.description,
        about: ev.about,
        expirationDate: new Date(ev.expirationDate),
        address: ev.address,
        addressNumber: ev.addressNumber,
        ticketUrl: ev.ticketUrl,
        banner: `/uploads/banner-${ev.img}.jpg`,
        poster: `/uploads/poster-${ev.img}.jpg`,
        gallery: [`/uploads/poster-${ev.img}.jpg`, `/uploads/banner-${ev.img}.jpg`],
        status: ev.approved ? 'APPROVED' : 'PENDING_MODERATION',
        userId: organizer.id,
        approvedById: ev.approved ? admin.id : null,
        cityId: city(ev.citySlug).id,
        categoryId: catId[ev.cats[0]] ?? null,
        prices: { create: ev.prices },
        dates: {
          create: ev.dates.map((d) => ({
            date: new Date(d.date),
            startTime: d.startTime,
            endTime: d.endTime,
          })),
        },
        socialLinks: ev.socials?.length
          ? { create: ev.socials.map((l) => ({ link: l })) }
          : undefined,
        videos: ev.videos?.length
          ? { create: ev.videos.map((l) => ({ link: l })) }
          : undefined,
      },
    });
  }

  // ── Perfiles ──
  for (const u of [
    { id: (await prisma.user.findUnique({ where: { email: 'superadmin@konbini.cl' }, select: { id: true } }))!.id, displayName: 'Super Admin', slug: 'superadmin' },
    { id: (await prisma.user.findUnique({ where: { email: 'admin@konbini.cl' }, select: { id: true } }))!.id, displayName: 'Equipo Konbini', slug: 'equipo-konbini' },
    { id: (await prisma.user.findUnique({ where: { email: 'organizador@konbini.cl' }, select: { id: true } }))!.id, displayName: 'Camila Rojas', slug: 'camila-rojas' },
  ]) {
    await prisma.profile.upsert({
      where: { userId: u.id },
      create: { userId: u.id, displayName: u.displayName, slug: u.slug },
      update: {},
    });
  }

  // ── Likes en eventos y artículos ──
  const allEvents = await prisma.event.findMany({ select: { id: true }, take: 6 });
  const allArticles = await prisma.article.findMany({ select: { id: true } });
  const organizadorId = (await prisma.user.findUnique({ where: { email: 'organizador@konbini.cl' }, select: { id: true } }))!.id;
  const adminId = (await prisma.user.findUnique({ where: { email: 'admin@konbini.cl' }, select: { id: true } }))!.id;
  for (const ev of allEvents.slice(0, 4)) {
    await prisma.like.createMany({ data: [{ userId: organizadorId, eventId: ev.id }, { userId: adminId, eventId: ev.id }], skipDuplicates: true });
  }
  for (const ev of allEvents.slice(4)) {
    await prisma.like.createMany({ data: [{ userId: organizadorId, eventId: ev.id }], skipDuplicates: true });
  }
  for (const art of allArticles) {
    await prisma.like.createMany({ data: [{ userId: organizadorId, articleId: art.id }], skipDuplicates: true });
  }

  // ─────────────── Settings defaults (v2 — Phase 8) ───────────────
  // Estos valores existen en la DB desde Phase 8, pero el código de aplicación
  // sigue leyendo de env vars hasta que Phase 11 los migre a leer de Settings.

  const settingsDefaults: { key: string; value: string }[] = [
    { key: 'SPOT_PRICE_PER_DAY',          value: '8000' },
    { key: 'SPOT_MIN_DAYS',               value: '10' },
    { key: 'SPOT_MAX_DAYS',               value: '30' },
    { key: 'SPOT_MAX_ACTIVE',             value: '10' },
    { key: 'HERO_PRICE_PER_DAY',          value: '15000' },
    { key: 'HERO_MIN_DAYS',               value: '10' },
    { key: 'HERO_MAX_DAYS',               value: '30' },
    { key: 'HERO_MAX_ACTIVE',             value: '5' },
    { key: 'SUBSCRIPTION_PRICE',          value: '9990' },
    { key: 'SUBSCRIPTION_CREDITS',        value: '10' },
    { key: 'SUBSCRIPTION_SPOT_DISCOUNT',  value: '20' },
    { key: 'SUBSCRIPTION_HERO_DISCOUNT',  value: '20' },
    { key: 'EVENT_MAX_DAYS',              value: '60' },
    { key: 'ARTICLE_PRICE',               value: '5000' },
  ];

  for (const setting of settingsDefaults) {
    await prisma.settings.upsert({
      where: { key: setting.key },
      update: {},  // NO sobreescribir si el admin ya cambió el valor
      create: setting,
    });
  }

  console.log(`✓ Settings seeded: ${settingsDefaults.length} defaults (upsert no-op si existían)`);

  // ── LegalDocuments ──
  await prisma.legalDocument.upsert({
    where: { type: 'PRIVACY_POLICY' },
    create: {
      type: 'PRIVACY_POLICY',
      content: `# Política de Privacidad — Konbini

Konbini trata los datos personales que nos proporcionas de acuerdo con la Ley N° 21.719
de Protección de Datos Personales de Chile y las demás normas aplicables.

## Datos que recopilamos

Recopilamos los datos que nos proporcionas al registrarte (nombre, correo electrónico,
contraseña), los datos de los eventos que publicas y los datos técnicos de uso de la
plataforma.

## Registros de auditoría

Para garantizar la trazabilidad y la seguridad de la plataforma, Konbini registra
las acciones administrativas y de publicación que realizan los usuarios sobre los
contenidos del sistema (eventos, avisos y portadas). Cada registro incluye la fecha,
la acción realizada, la entidad afectada y, cuando corresponde, la dirección IP y el
agente de usuario (navegador) desde el que se originó la acción.

La dirección IP y el agente de usuario constituyen datos personales conforme a la
Ley N° 21.719. Se tratan con la única finalidad de auditoría y seguridad, y se
conservan por un plazo máximo de 24 meses, transcurrido el cual son eliminados. El
titular puede ejercer sus derechos de acceso, rectificación y supresión sobre estos
registros conforme a la ley vigente.

## Tus derechos

Puedes ejercer tus derechos de acceso, rectificación, supresión, portabilidad y oposición
escribiéndonos a hola@konbini.cl.`,
    },
    update: {
      content: `# Política de Privacidad — Konbini

Konbini trata los datos personales que nos proporcionas de acuerdo con la Ley N° 21.719
de Protección de Datos Personales de Chile y las demás normas aplicables.

## Datos que recopilamos

Recopilamos los datos que nos proporcionas al registrarte (nombre, correo electrónico,
contraseña), los datos de los eventos que publicas y los datos técnicos de uso de la
plataforma.

## Registros de auditoría

Para garantizar la trazabilidad y la seguridad de la plataforma, Konbini registra
las acciones administrativas y de publicación que realizan los usuarios sobre los
contenidos del sistema (eventos, avisos y portadas). Cada registro incluye la fecha,
la acción realizada, la entidad afectada y, cuando corresponde, la dirección IP y el
agente de usuario (navegador) desde el que se originó la acción.

La dirección IP y el agente de usuario constituyen datos personales conforme a la
Ley N° 21.719. Se tratan con la única finalidad de auditoría y seguridad, y se
conservan por un plazo máximo de 24 meses, transcurrido el cual son eliminados. El
titular puede ejercer sus derechos de acceso, rectificación y supresión sobre estos
registros conforme a la ley vigente.

## Tus derechos

Puedes ejercer tus derechos de acceso, rectificación, supresión, portabilidad y oposición
escribiéndonos a hola@konbini.cl.`,
    },
  });

  // ── Conteo final ──
  const counts = {
    countries: await prisma.country.count(),
    states: await prisma.state.count(),
    cities: await prisma.city.count(),
    categories: await prisma.category.count(),
    tags: await prisma.tag.count(),
    articles: await prisma.article.count(),
    heroes: await prisma.hero.count(),
    spots: await prisma.spot.count(),
    events: await prisma.event.count(),
    users: await prisma.user.count(),
    profiles: await prisma.profile.count(),
    likes: await prisma.like.count(),
  };
  console.log('✅ Seed completo:', counts);
}

main()
  .catch((e) => {
    console.error('❌ Seed falló:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
