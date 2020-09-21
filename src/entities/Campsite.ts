import { ObjectType, Field, Int } from 'type-graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Camper } from './Camper';
import { GearCategory } from './GearCategory';
import { User } from './User';

@ObjectType()
@Entity()
export class Campsite extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => String)
  @Column({ type: 'text' })
  name!: string;

  @Field(() => Int)
  @Column()
  counselorId!: number;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.campsites)
  counselor: User;

  @Field(() => [Camper])
  @OneToMany(() => Camper, (camper) => camper.userId)
  campers: Camper[];

  @Field(() => [GearCategory])
  @OneToMany(() => GearCategory, (gc) => gc.campsiteId)
  gearCategories: GearCategory[];

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt: Date;
}
