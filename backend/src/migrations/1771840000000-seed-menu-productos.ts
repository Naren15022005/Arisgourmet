import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedMenuProductos1771840000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Obtener el ID canónico del restaurante arisgourmet
    const restRows = await queryRunner.query(
      `SELECT id FROM restaurante WHERE slug = 'arisgourmet' LIMIT 1`,
    );

    const restId = restRows && restRows.length > 0 ? restRows[0].id : '42caa066-52d5-40fa-981e-10a016ced9c5';

    // Insertar productos gourmet representativos si no existen aún
    const productos = [
      {
        id: '10000000-0000-0000-0000-000000000001',
        nombre: 'Lomo Saltado Criollo',
        descripcion: 'Tiras de lomo fino salteadas al wok con cebolla morada, tomate fresco, ají amarillo y crujientes papas fritas. Servido con arroz.',
        precio: 16.50,
        tiempo: 15,
      },
      {
        id: '10000000-0000-0000-0000-000000000002',
        nombre: 'Ceviche Clásico de Corvina',
        descripcion: 'Fresca corvina marinada en jugo de lima recién exprimido, leche de tigre, choclo tierno y camote glaseado.',
        precio: 14.00,
        tiempo: 10,
      },
      {
        id: '10000000-0000-0000-0000-000000000003',
        nombre: 'Risotto de Hongos Porcini y Trufa',
        descripcion: 'Arroz arborio cocido a fuego lento con setas silvestres, mantequilla aromatizada a la trufa blanca y queso parmesano Reggiano.',
        precio: 15.00,
        tiempo: 18,
      },
      {
        id: '10000000-0000-0000-0000-000000000004',
        nombre: 'Hamburguesa Gourmet Angus',
        descripcion: '200g de carne Angus premium, queso cheddar madurado, cebolla caramelizada y alioli de ajo asado en pan brioche.',
        precio: 12.50,
        tiempo: 12,
      },
      {
        id: '10000000-0000-0000-0000-000000000005',
        nombre: 'Tacos de Birria de Res (3 uds)',
        descripcion: 'Carne braseada 6 horas en chiles secos, queso Oaxaca derretido y cilantro sobre tortillas de maíz, acompañados de su consomé.',
        precio: 11.00,
        tiempo: 12,
      },
      {
        id: '10000000-0000-0000-0000-000000000006',
        nombre: 'Tiramisú Tradicional',
        descripcion: 'Capas de bizcochos soletilla empapados en café espresso italiano y licor Amaretto, con crema aterciopelada de mascarpone y cacao.',
        precio: 6.50,
        tiempo: 5,
      },
      {
        id: '10000000-0000-0000-0000-000000000007',
        nombre: 'Limonada de Hierbabuena',
        descripcion: 'Bebida refrescante a base de limones recién exprimidos, hojas de hierbabuena fresca machacada y un toque de jengibre.',
        precio: 3.50,
        tiempo: 5,
      },
      {
        id: '10000000-0000-0000-0000-000000000008',
        nombre: 'Copa de Vino Tinto Reserva',
        descripcion: 'Copa de vino tinto crianza con notas a frutos rojos y sutil aroma a roble.',
        precio: 7.00,
        tiempo: 3,
      },
    ];

    for (const p of productos) {
      await queryRunner.query(
        `INSERT INTO producto (id, restaurante_id, nombre, descripcion, precio, disponible, tiempo_base_minutos)
         VALUES (?, ?, ?, ?, ?, 1, ?)
         ON DUPLICATE KEY UPDATE
           restaurante_id = VALUES(restaurante_id),
           nombre = VALUES(nombre),
           descripcion = VALUES(descripcion),
           precio = VALUES(precio),
           disponible = 1,
           tiempo_base_minutos = VALUES(tiempo_base_minutos)`,
        [p.id, restId, p.nombre, p.descripcion, p.precio, p.tiempo],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM producto WHERE id LIKE '10000000-0000-0000-0000-00000000000%'`,
    );
  }
}
