import { ParamsDictionary } from 'express-serve-static-core';

export interface BillIdParams extends ParamsDictionary {
    billId: string
}