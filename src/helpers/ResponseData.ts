import { ResponseBase } from "./ResponseBase";

export interface ResponseData extends ResponseBase {
  data: any;
}

export default (
  statusCode: number,
  message: string,
  data: any
): ResponseData => ({
  statusCode,
  message,
  data,
});
