import { ObjectType, Field, Int } from 'type-graphql';
import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Campsite } from './Campsite';

enum CamperRole {
  Counselor = 'counselor',
  Camper = 'camper',
}

@ObjectType()
@Entity()
export class Camper extends BaseEntity {
  @Field(() => Int)
  @PrimaryColumn()
  userId!: number;

  @Field(() => String)
  @Column({ default: 'camper' })
  role: CamperRole;

  @Field(() => Int)
  @PrimaryColumn()
  campsiteId!: number;

  @Field(() => Campsite)
  @ManyToOne(() => Campsite, (campsite) => campsite.campers, {
    onDelete: 'CASCADE',
  })
  campsite: Campsite;

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt: Date;
}
