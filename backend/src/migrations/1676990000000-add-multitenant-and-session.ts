import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMultitenantAndSession1676990000000 implements MigrationInterface {
  name = 'AddMultitenantAndSession1676990000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS restaurantes (
        id varchar(36) NOT NULL,
        nombre varchar(255) NOT NULL,
        direccion varchar(255) DEFAULT NULL,
        telefono varchar(255) DEFAULT NULL,
        created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS permisos (
        id varchar(36) NOT NULL,
        clave varchar(255) NOT NULL,
        descripcion varchar(255) DEFAULT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY UQ_permiso_clave (clave)
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id varchar(36) NOT NULL,
        nombre varchar(255) NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY UQ_role_nombre (nombre)
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS role_permisos (
        roleId varchar(36) NOT NULL,
        permisoId varchar(36) NOT NULL,
        PRIMARY KEY (roleId, permisoId),
        INDEX IDX_role (roleId),
        INDEX IDX_permiso (permisoId),
        CONSTRAINT FK_role_permisos_role FOREIGN KEY (roleId) REFERENCES roles(id) ON DELETE CASCADE,
        CONSTRAINT FK_role_permisos_permiso FOREIGN KEY (permisoId) REFERENCES permisos(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS sesiones_mesa (
        id varchar(36) NOT NULL,
        mesa_id varchar(36) NOT NULL,
        cliente_nombre varchar(255) DEFAULT NULL,
        inicio_at datetime DEFAULT NULL,
        fin_at datetime DEFAULT NULL,
        created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX IDX_mesa_sesion_mesa (mesa_id),
        CONSTRAINT FK_mesa_sesion_mesa FOREIGN KEY (mesa_id) REFERENCES mesas(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS historial_estado_pedido (
        id varchar(36) NOT NULL,
        pedido_id varchar(36) NOT NULL,
        estado_anterior varchar(255) NOT NULL,
        estado_nuevo varchar(255) NOT NULL,
        nota text DEFAULT NULL,
        created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX IDX_historial_pedido (pedido_id),
        CONSTRAINT FK_historial_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS notificaciones (
        id varchar(36) NOT NULL,
        tipo varchar(255) NOT NULL,
        mensaje text NOT NULL,
        usuario_id varchar(36) DEFAULT NULL,
        leido tinyint(1) NOT NULL DEFAULT 0,
        created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX IDX_notificacion_usuario (usuario_id)
      ) ENGINE=InnoDB;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS notificaciones`);
    await queryRunner.query(`DROP TABLE IF EXISTS historial_estado_pedido`);
    await queryRunner.query(`DROP TABLE IF EXISTS mesa_sesion`);
    await queryRunner.query(`DROP TABLE IF EXISTS role_permisos`);
    await queryRunner.query(`DROP TABLE IF EXISTS roles`);
    await queryRunner.query(`DROP TABLE IF EXISTS permisos`);
    await queryRunner.query(`DROP TABLE IF EXISTS restaurantes`);
  }
}
