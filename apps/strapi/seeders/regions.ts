// /seeders/regions.ts

import slugify from "slugify";

const regionsData = [
  {
    region: "Arica y Parinacota",
    communes: ["Arica", "Camarones", "Putre", "General Lagos"],
  },
  {
    region: "Tarapacá",
    communes: [
      "Iquique",
      "Alto Hospicio",
      "Pozo Almonte",
      "Camiña",
      "Colchane",
      "Huara",
      "Pica",
    ],
  },
  {
    region: "Antofagasta",
    communes: [
      "Antofagasta",
      "Mejillones",
      "Sierra Gorda",
      "Taltal",
      "Calama",
      "Ollagüe",
      "San Pedro de Atacama",
      "Tocopilla",
      "María Elena",
    ],
  },
  {
    region: "Atacama",
    communes: [
      "Copiapó",
      "Caldera",
      "Tierra Amarilla",
      "Chañaral",
      "Diego de Almagro",
      "Vallenar",
      "Alto del Carmen",
      "Freirina",
      "Huasco",
    ],
  },
  {
    region: "Coquimbo",
    communes: [
      "La Serena",
      "Coquimbo",
      "Andacollo",
      "La Higuera",
      "Paiguano",
      "Vicuña",
      "Illapel",
      "Canela",
      "Los Vilos",
      "Salamanca",
      "Ovalle",
      "Combarbalá",
      "Monte Patria",
      "Punitaqui",
      "Río Hurtado",
    ],
  },
  {
    region: "Valparaíso",
    communes: [
      "Valparaíso",
      "Casablanca",
      "Concón",
      "Juan Fernández",
      "Puchuncaví",
      "Quintero",
      "Viña del Mar",
      "Isla de Pascua",
      "Los Andes",
      "Calle Larga",
      "Rinconada",
      "San Esteban",
      "La Ligua",
      "Cabildo",
      "Papudo",
      "Petorca",
      "Zapallar",
      "Quillota",
      "Calera",
      "Hijuelas",
      "La Cruz",
      "Nogales",
      "San Antonio",
      "Algarrobo",
      "Cartagena",
      "El Quisco",
      "El Tabo",
      "Santo Domingo",
      "San Felipe",
      "Catemu",
      "Llaillay",
      "Panquehue",
      "Putaendo",
      "Santa María",
      "Quilpué",
      "Limache",
      "Olmué",
      "Villa Alemana",
    ],
  },
  {
    region: "Región del Libertador Gral. Bernardo O'Higgins",
    communes: [
      "Rancagua",
      "Codegua",
      "Coinco",
      "Coltauco",
      "Doñihue",
      "Graneros",
      "Las Cabras",
      "Machalí",
      "Malloa",
      "Mostazal",
      "Olivar",
      "Peumo",
      "Pichidegua",
      "Quinta de Tilcoco",
      "Rengo",
      "Requínoa",
      "San Vicente",
      "Pichilemu",
      "La Estrella",
      "Litueche",
      "Marchihue",
      "Navidad",
      "Paredones",
      "San Fernando",
      "Chépica",
      "Chimbarongo",
      "Lolol",
      "Nancagua",
      "Palmilla",
      "Peralillo",
      "Placilla",
      "Pumanque",
      "Santa Cruz",
    ],
  },
  {
    region: "Región del Maule",
    communes: [
      "Talca",
      "Constitución",
      "Curepto",
      "Empedrado",
      "Maule",
      "Pelarco",
      "Pencahue",
      "Río Claro",
      "San Clemente",
      "San Rafael",
      "Cauquenes",
      "Chanco",
      "Pelluhue",
      "Curicó",
      "Hualañé",
      "Licantén",
      "Molina",
      "Rauco",
      "Romeral",
      "Sagrada Familia",
      "Teno",
      "Vichuquén",
      "Linares",
      "Colbún",
      "Longaví",
      "Parral",
      "Retiro",
      "San Javier",
      "Villa Alegre",
      "Yerbas Buenas",
    ],
  },
  {
    region: "Región de Ñuble",
    communes: [
      "Cobquecura",
      "Coelemu",
      "Ninhue",
      "Portezuelo",
      "Quirihue",
      "Ránquil",
      "Treguaco",
      "Bulnes",
      "Chillán Viejo",
      "Chillán",
      "El Carmen",
      "Pemuco",
      "Pinto",
      "Quillón",
      "San Ignacio",
      "Yungay",
      "Coihueco",
      "Ñiquén",
      "San Carlos",
      "San Fabián",
      "San Nicolás",
    ],
  },
  {
    region: "Región del Biobío",
    communes: [
      "Concepción",
      "Coronel",
      "Chiguayante",
      "Florida",
      "Hualqui",
      "Lota",
      "Penco",
      "San Pedro de la Paz",
      "Santa Juana",
      "Talcahuano",
      "Tomé",
      "Hualpén",
      "Lebu",
      "Arauco",
      "Cañete",
      "Contulmo",
      "Curanilahue",
      "Los Álamos",
      "Tirúa",
      "Los Ángeles",
      "Antuco",
      "Cabrero",
      "Laja",
      "Mulchén",
      "Nacimiento",
      "Negrete",
      "Quilaco",
      "Quilleco",
      "San Rosendo",
      "Santa Bárbara",
      "Tucapel",
      "Yumbel",
      "Alto Biobío",
    ],
  },
  {
    region: "Región de la Araucanía",
    communes: [
      "Temuco",
      "Carahue",
      "Cunco",
      "Curarrehue",
      "Freire",
      "Galvarino",
      "Gorbea",
      "Lautaro",
      "Loncoche",
      "Melipeuco",
      "Nueva Imperial",
      "Padre las Casas",
      "Perquenco",
      "Pitrufquén",
      "Pucón",
      "Saavedra",
      "Teodoro Schmidt",
      "Toltén",
      "Vilcún",
      "Villarrica",
      "Cholchol",
      "Angol",
      "Collipulli",
      "Curacautín",
      "Ercilla",
      "Lonquimay",
      "Los Sauces",
      "Lumaco",
      "Purén",
      "Renaico",
      "Traiguén",
      "Victoria",
    ],
  },
  {
    region: "Región de Los Ríos",
    communes: [
      "Valdivia",
      "Corral",
      "Lanco",
      "Los Lagos",
      "Máfil",
      "Mariquina",
      "Paillaco",
      "Panguipulli",
      "La Unión",
      "Futrono",
      "Lago Ranco",
      "Río Bueno",
    ],
  },
  {
    region: "Región de Los Lagos",
    communes: [
      "Puerto Montt",
      "Calbuco",
      "Cochamó",
      "Fresia",
      "Frutillar",
      "Los Muermos",
      "Llanquihue",
      "Maullín",
      "Puerto Varas",
      "Castro",
      "Ancud",
      "Chonchi",
      "Curaco de Vélez",
      "Dalcahue",
      "Puqueldón",
      "Queilén",
      "Quellón",
      "Quemchi",
      "Quinchao",
      "Osorno",
      "Puerto Octay",
      "Purranque",
      "Puyehue",
      "Río Negro",
      "San Juan de la Costa",
      "San Pablo",
      "Chaitén",
      "Futaleufú",
      "Hualaihué",
      "Palena",
    ],
  },
  {
    region: "Región Aisén del Gral. Carlos Ibáñez del Campo",
    communes: [
      "Coihaique",
      "Lago Verde",
      "Aisén",
      "Cisnes",
      "Guaitecas",
      "Cochrane",
      "O'Higgins",
      "Tortel",
      "Chile Chico",
      "Río Ibáñez",
    ],
  },
  {
    region: "Región de Magallanes y de la Antártica Chilena",
    communes: [
      "Punta Arenas",
      "Laguna Blanca",
      "Río Verde",
      "San Gregorio",
      "Cabo de Hornos (Ex Navarino)",
      "Antártica",
      "Porvenir",
      "Primavera",
      "Timaukel",
      "Natales",
      "Torres del Paine",
    ],
  },
  {
    region: "Región Metropolitana de Santiago",
    communes: [
      "Cerrillos",
      "Cerro Navia",
      "Conchalí",
      "El Bosque",
      "Estación Central",
      "Huechuraba",
      "Independencia",
      "La Cisterna",
      "La Florida",
      "La Granja",
      "La Pintana",
      "La Reina",
      "Las Condes",
      "Lo Barnechea",
      "Lo Espejo",
      "Lo Prado",
      "Macul",
      "Maipú",
      "Ñuñoa",
      "Pedro Aguirre Cerda",
      "Peñalolén",
      "Providencia",
      "Pudahuel",
      "Quilicura",
      "Quinta Normal",
      "Recoleta",
      "Renca",
      "Santiago",
      "San Joaquín",
      "San Miguel",
      "San Ramón",
      "Vitacura",
      "Puente Alto",
      "Pirque",
      "San José de Maipo",
      "Colina",
      "Lampa",
      "Tiltil",
      "San Bernardo",
      "Buin",
      "Calera de Tango",
      "Paine",
      "Melipilla",
      "Alhué",
      "Curacaví",
      "María Pinto",
      "San Pedro",
      "Talagante",
      "El Monte",
      "Isla de Maipo",
      "Padre Hurtado",
      "Peñaflor",
    ],
  },
];

const populateRegions = async (strapi: any) => {
  console.log("Poblando regiones y comunas...");

  let totalCommunes = 0;
  regionsData.forEach((region) => (totalCommunes += region.communes.length));

  console.log(
    `Procesando ${regionsData.length} regiones y ${totalCommunes} comunas...`
  );

  for (const regionData of regionsData) {
    try {
      const regionSlug = slugify(regionData.region, {
        lower: true,
        strict: true,
      });

      // Verificar si la región ya existe
      const existingRegion = await strapi.entityService.findMany("api::region.region", {
        filters: { slug: regionSlug },
      });

      let regionId;

      if (existingRegion.length > 0) {
        console.log(`Región ya existe: ${regionData.region}`);
        regionId = existingRegion[0].id;
      } else {
        // Crear la región usando strapi.entityService para que se publique automáticamente
        const createdRegion = await strapi.entityService.create("api::region.region", {
          data: {
            name: regionData.region,
            slug: regionSlug,
          },
        });

        regionId = createdRegion.id;
        console.log(`✅ Región creada: ${regionData.region}`);
      }

      // Crear las comunas asociadas a la región
      for (const communeName of regionData.communes) {
        try {
          const communeSlug = slugify(communeName, {
            lower: true,
            strict: true,
          });

          // Verificar si la comuna ya existe
          const existingCommune = await strapi.entityService.findMany("api::commune.commune", {
            filters: { slug: communeSlug },
          });

          if (existingCommune.length > 0) {
            console.log(`Comuna ya existe: ${communeName}`);
            continue;
          }

          // Crear la comuna usando strapi.entityService para que se publique automáticamente
          await strapi.entityService.create("api::commune.commune", {
            data: {
              name: communeName,
              slug: communeSlug,
              region: regionId, // Relación con la región
            },
          });

          console.log(
            `✅ Comuna creada: ${communeName} (${regionData.region})`
          );
        } catch (communeError) {
          console.error(
            `❌ Error creando comuna ${communeName}:`,
            communeError.message
          );
        }
      }
    } catch (regionError) {
      console.error(
        `❌ Error creando región ${regionData.region}:`,
        regionError.message
      );
    }
  }

  console.log("🎉 Datos de regiones y comunas poblados exitosamente");
};

// Esta función será llamada desde el bootstrap de src/index.ts

export default populateRegions;
