import { ParamsDictionary } from 'express-serve-static-core';

export interface BillAndCardParams extends ParamsDictionary {
  billId: string;
  cardId: string;
}