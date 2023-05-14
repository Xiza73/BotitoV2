export interface ResponseBase {
  statusCode: number;
  message: string;
}

export default (statusCode: number, message: string): ResponseBase => ({
  statusCode,
  message,
});
