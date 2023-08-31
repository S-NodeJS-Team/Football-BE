import { IQueryObject } from 'src/common/interface';

export interface ITeamQuery extends IQueryObject {
  name?: string | object;
}