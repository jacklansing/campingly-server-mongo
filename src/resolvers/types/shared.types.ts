export enum CampsiteRole {
  CAMPER = 'CAMPER',
  COUNSELOR = 'COUNSELOR',
  MANAGER = 'MANAGER',
}

export type FieldError = {
  field: string;
  message: string;
};

export type ErrorMessage = {
  message: string;
};
