import {MigrationInterface, QueryRunner} from "typeorm";

export class CampsiteGearMigration1600638931391 implements MigrationInterface {
    name = 'CampsiteGearMigration1600638931391'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "camper" ("userId" integer NOT NULL, "role" character varying NOT NULL DEFAULT 'camper', "campsiteId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2212d129ec2b3841580798a6ed8" PRIMARY KEY ("userId", "campsiteId"))`);
        await queryRunner.query(`CREATE TABLE "gear_volunteer" ("gearId" integer NOT NULL, "userId" integer NOT NULL, "volunteerAmount" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "gearGearCategoryId" integer, CONSTRAINT "PK_e46388791c734853713e7a80953" PRIMARY KEY ("gearId", "userId"))`);
        await queryRunner.query(`CREATE TABLE "gear" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "quantity" integer NOT NULL DEFAULT 0, "gearCategoryId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "gearCategoryCampsiteId" integer, CONSTRAINT "PK_6afbbd394ffd41d6b73b08ab716" PRIMARY KEY ("id", "gearCategoryId"))`);
        await queryRunner.query(`CREATE TABLE "gear_category" ("id" SERIAL NOT NULL, "category" character varying NOT NULL, "campsiteId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a708b2d21c93e4e880664712ad0" PRIMARY KEY ("id", "campsiteId"))`);
        await queryRunner.query(`CREATE TABLE "campsite" ("id" SERIAL NOT NULL, "name" text NOT NULL, "counselorId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2fdd619b3981a8e68f3601c3d32" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "camper" ADD CONSTRAINT "FK_15e13ded310d2ec2ba8eb656af3" FOREIGN KEY ("campsiteId") REFERENCES "campsite"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "gear_volunteer" ADD CONSTRAINT "FK_065fdf91e8b27c527acdb05f69a" FOREIGN KEY ("gearId", "gearGearCategoryId") REFERENCES "gear"("id","gearCategoryId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "gear" ADD CONSTRAINT "FK_49d95db410eddaff71fbccbe179" FOREIGN KEY ("gearCategoryId", "gearCategoryCampsiteId") REFERENCES "gear_category"("id","campsiteId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "gear_category" ADD CONSTRAINT "FK_47ffcafb953fe0afe0fd4f9e973" FOREIGN KEY ("campsiteId") REFERENCES "campsite"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "campsite" ADD CONSTRAINT "FK_42603d0182f32547f8c7cdf9076" FOREIGN KEY ("counselorId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "campsite" DROP CONSTRAINT "FK_42603d0182f32547f8c7cdf9076"`);
        await queryRunner.query(`ALTER TABLE "gear_category" DROP CONSTRAINT "FK_47ffcafb953fe0afe0fd4f9e973"`);
        await queryRunner.query(`ALTER TABLE "gear" DROP CONSTRAINT "FK_49d95db410eddaff71fbccbe179"`);
        await queryRunner.query(`ALTER TABLE "gear_volunteer" DROP CONSTRAINT "FK_065fdf91e8b27c527acdb05f69a"`);
        await queryRunner.query(`ALTER TABLE "camper" DROP CONSTRAINT "FK_15e13ded310d2ec2ba8eb656af3"`);
        await queryRunner.query(`DROP TABLE "campsite"`);
        await queryRunner.query(`DROP TABLE "gear_category"`);
        await queryRunner.query(`DROP TABLE "gear"`);
        await queryRunner.query(`DROP TABLE "gear_volunteer"`);
        await queryRunner.query(`DROP TABLE "camper"`);
    }

}
