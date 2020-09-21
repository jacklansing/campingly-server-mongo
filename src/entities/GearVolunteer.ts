import { ObjectType, Field, Int } from 'type-graphql';
import {
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  ManyToOne,
  PrimaryColumn,
  Column,
} from 'typeorm';
import { Gear } from './Gear';

@ObjectType()
@Entity()
export class GearVolunteer extends BaseEntity {
  @Field(() => Int)
  @PrimaryColumn()
  gearId!: number;

  @Field(() => Int)
  @PrimaryColumn()
  userId!: number;

  @Field(() => Int)
  @Column({ type: 'int' })
  volunteerAmount!: number;

  @Field(() => Gear)
  @ManyToOne(() => Gear, (g) => g.gearCategoryId)
  gear: Gear;

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt: Date;
}
