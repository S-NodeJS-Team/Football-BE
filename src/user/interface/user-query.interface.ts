import { IQueryObject } from 'src/common/interface';

export interface IUserQuery extends IQueryObject {
  name?: string | object;
}

export interface IUserFilter {
  positions?: string[];
}

export interface IUserParams {
  playerId: string;
}
