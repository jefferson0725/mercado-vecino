import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { auth } from "../src/lib/auth";

async function ensureUser(email: string, password: string, name: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;
  await auth.api.signUpEmail({ body: { email, password, name } });
  return prisma.user.findUniqueOrThrow({ where: { email } });
}

const SEED_CATEGORIES = [
  { id: "comida-rapida",  name: "Comida rápida",               slug: "comida-rapida"  },
  { id: "comida-casera",  name: "Comida casera",                slug: "comida-casera"  },
  { id: "postres",        name: "Postres y repostería",         slug: "postres"        },
  { id: "bebidas",        name: "Bebidas",                      slug: "bebidas"        },
  { id: "mercado",        name: "Mercado y abarrotes",          slug: "mercado"        },
  { id: "ropa",           name: "Ropa y calzado",               slug: "ropa"           },
  { id: "accesorios",     name: "Accesorios",                   slug: "accesorios"     },
  { id: "tecnologia",     name: "Tecnología",                   slug: "tecnologia"     },
  { id: "belleza",        name: "Belleza y cuidado personal",   slug: "belleza"        },
  { id: "mascotas",       name: "Mascotas",                     slug: "mascotas"       },
  { id: "hogar",          name: "Hogar y decoración",           slug: "hogar"          },
  { id: "papeleria",      name: "Papelería y detalles",         slug: "papeleria"      },
  { id: "servicios",      name: "Servicios",                    slug: "servicios"      },
  { id: "otros",          name: "Otros",                        slug: "otros"          },
  { id: "reparaciones",   name: "Reparaciones y mantenimiento", slug: "reparaciones"   },
  { id: "clases",         name: "Clases y asesorías",           slug: "clases"         },
  { id: "limpieza",       name: "Limpieza y cuidado",           slug: "limpieza"       },
];

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error("Define ADMIN_EMAIL y ADMIN_PASSWORD en .env antes de correr el seed");
  }

  const admin = await ensureUser(adminEmail, adminPassword, process.env.ADMIN_NAME ?? "Admin");
  await prisma.user.update({ where: { id: admin.id }, data: { role: "ADMIN", emailVerified: true } });
  console.log(`Admin listo: ${adminEmail}`);

  // Datos de prueba solo si SEED_DEMO=1 (en producción se crea todo desde /admin)
  if (process.env.SEED_DEMO !== "1") {
    console.log("SEED_DEMO no está en 1: no se crean datos de prueba.");
    return;
  }

  // Upsert the 17 categories
  for (const cat of SEED_CATEGORIES) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: { name: cat.name, slug: cat.slug },
      create: cat,
    });
  }
  console.log(`Categorías listas: ${SEED_CATEGORIES.length}`);

  const conjunto = await prisma.conjunto.upsert({
    where: { slug: "conjunto-demo" },
    update: {},
    create: {
      name: "Conjunto Demo",
      slug: "conjunto-demo",
      inviteCode: "DEMO-2026",
    },
  });
  console.log(`Conjunto listo: /${conjunto.slug} (código de invitación: ${conjunto.inviteCode})`);

  const seller = await ensureUser("vendedor@demo.com", "vendedor123", "María Demo");
  await prisma.user.update({ where: { id: seller.id }, data: { emailVerified: true } });

  const existingBusiness = await prisma.business.findUnique({ where: { ownerId: seller.id } });
  if (!existingBusiness) {
    await prisma.business.create({
      data: {
        conjuntoId: conjunto.id,
        ownerId: seller.id,
        name: "Donas de María",
        slug: "donas-de-maria",
        description: "Donas artesanales por encargo. Entrego en la portería o a domicilio dentro del conjunto.",
        whatsappNumber: "573001112233",
        categories: { connect: [{ id: "postres" }, { id: "comida-rapida" }] },
        opensAt: "08:00",
        closesAt: "21:00",
        openDays: ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"],
        isOpen: true,
        products: {
          create: [
            {
              name: "Caja x6 donas glaseadas",
              slug: "caja-x6-donas-glaseadas",
              description: "Sabores surtidos: chocolate, vainilla y arequipe.",
              price: 18000,
              sortOrder: 1,
            },
            {
              name: "Dona individual",
              slug: "dona-individual",
              description: "Escoge tu sabor favorito.",
              price: 3500,
              sortOrder: 2,
            },
            {
              name: "Caja x12 donas mini",
              slug: "caja-x12-donas-mini",
              description: "Perfectas para fiestas.",
              price: 25000,
              available: false,
              sortOrder: 3,
            },
          ],
        },
      },
    });
  } else {
    // Ensure categories are connected (idempotent)
    await prisma.business.update({
      where: { id: existingBusiness.id },
      data: {
        categories: { set: [{ id: "postres" }, { id: "comida-rapida" }] },
      },
    });
  }
  console.log("Negocio demo listo: Donas de María (vendedor@demo.com / vendedor123)");

  // Upsert the COTIZAR demo product (idempotent by name+businessId)
  const demoBusinessFinal = await prisma.business.findUniqueOrThrow({
    where: { ownerId: seller.id },
    select: { id: true },
  });
  const existingCotizarProduct = await prisma.product.findFirst({
    where: {
      businessId: demoBusinessFinal.id,
      name: "Domicilio de donas fuera del conjunto",
    },
  });
  if (!existingCotizarProduct) {
    await prisma.product.create({
      data: {
        businessId: demoBusinessFinal.id,
        name: "Domicilio de donas fuera del conjunto",
        slug: "domicilio-de-donas-fuera-del-conjunto",
        description: "Lleva tus donas a donde estés.",
        priceType: "COTIZAR",
        price: 0,
        sortOrder: 3,
      },
    });
    console.log("Producto COTIZAR demo creado.");
  } else {
    console.log("Producto COTIZAR demo ya existe, omitiendo.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
