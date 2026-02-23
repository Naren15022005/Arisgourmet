import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMultitenantAndSession1676990000000 implements MigrationInterface {
  name = 'AddMultitenantAndSession1676990000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS restaurante (
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
      CREATE TABLE IF NOT EXISTS permiso (
        id varchar(36) NOT NULL,
        clave varchar(255) NOT NULL,
        descripcion varchar(255) DEFAULT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY UQ_permiso_clave (clave)
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS role (
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
        CONSTRAINT FK_role_permisos_role FOREIGN KEY (roleId) REFERENCES role(id) ON DELETE CASCADE,
        CONSTRAINT FK_role_permisos_permiso FOREIGN KEY (permisoId) REFERENCES permiso(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mesa_sesion (
        id varchar(36) NOT NULL,
        mesa_id varchar(36) NOT NULL,
        cliente_nombre varchar(255) DEFAULT NULL,
        inicio_at datetime DEFAULT NULL,
        fin_at datetime DEFAULT NULL,
        created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX IDX_mesa_sesion_mesa (mesa_id),
        CONSTRAINT FK_mesa_sesion_mesa FOREIGN KEY (mesa_id) REFERENCES mesa(id) ON DELETE CASCADE
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
        CONSTRAINT FK_historial_pedido FOREIGN KEY (pedido_id) REFERENCES pedido(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS notificacion (
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
    await queryRunner.query(`DROP TABLE IF EXISTS notificacion`);
    await queryRunner.query(`DROP TABLE IF EXISTS historial_estado_pedido`);
    await queryRunner.query(`DROP TABLE IF EXISTS mesa_sesion`);
    await queryRunner.query(`DROP TABLE IF EXISTS role_permisos`);
    await queryRunner.query(`DROP TABLE IF EXISTS role`);
    await queryRunner.query(`DROP TABLE IF EXISTS permiso`);
    await queryRunner.query(`DROP TABLE IF EXISTS restaurante`);
  }
}
