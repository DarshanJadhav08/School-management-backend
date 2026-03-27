export interface IRole {
  id: string;
  name: string;
}

export interface IRoleCreation extends Omit<IRole, "id"> {}
