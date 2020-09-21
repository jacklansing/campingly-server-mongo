import { ObjectType, Field, Int } from 'type-graphql';
import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Campsite } from './Campsite';
import { Gear } from './Gear';

@ObjectType()
@Entity()
export class GearCategory extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => String)
  @Column()
  category: string;

  @Field(() => Int)
  @PrimaryColumn()
  campsiteId!: number;

  @Field(() => Campsite)
  @ManyToOne(() => Campsite, (campsite) => campsite.gearCategories, {
    onDelete: 'CASCADE',
  })
  campsite: Campsite;

  @Field(() => [Gear])
  @OneToMany(() => Gear, (gear) => gear.gearCategory)
  gears: Gear[];

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt: Date;
}
