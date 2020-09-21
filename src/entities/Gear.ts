import { ObjectType, Field, Int } from 'type-graphql';
import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  PrimaryColumn,
} from 'typeorm';
import { GearCategory } from './GearCategory';
import { GearVolunteer } from './GearVolunteer';

@ObjectType()
@Entity()
export class Gear extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => String)
  @Column()
  name!: string;

  @Field(() => Int)
  @Column({ type: 'int', default: 0 })
  quantity!: number;

  @Field(() => Int)
  @PrimaryColumn()
  gearCategoryId!: number;

  @Field(() => GearCategory)
  @ManyToOne(() => GearCategory, (gc) => gc.gears)
  gearCategory: GearCategory;

  @Field(() => [GearVolunteer])
  @OneToMany(() => GearVolunteer, (gv) => gv.userId)
  gearVolunteers: GearVolunteer[];

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt: Date;
}
