import { BOT_VERSION } from "../shared/constants/branding";

const ok = (description: string, data?: object) => ({
  description,
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "integer", example: 200 },
          message: { type: "string" },
          ...(data && { data }),
        },
      },
    },
  },
});

const errors = {
  401: { description: "Falta el header x-api-key o es incorrecto" },
  422: { description: "Datos insuficientes" },
};

const user = {
  type: "object",
  properties: {
    _id: { type: "string" },
    name: { type: "string", example: "Diego" },
    discordId: { type: "string", example: "123456789012345678" },
    birthdayDay: { type: "integer", example: 17 },
    birthdayMonth: { type: "integer", example: 2, description: "1-12" },
    enableGreetings: { type: "boolean", example: true },
  },
};

const query = (name: string, schema: object, description?: string) => ({
  name,
  in: "query",
  required: true,
  schema,
  description,
});

const json = (properties: object, required: string[]) => ({
  required: true,
  content: {
    "application/json": {
      schema: { type: "object", required, properties },
    },
  },
});

export default {
  openapi: "3.0.3",
  info: {
    title: "Xiza Bot API",
    version: BOT_VERSION.replace(/^v/, ""),
    description:
      "Todas las rutas exigen el header `x-api-key`. Usa **Authorize** para cargarlo una vez.",
  },
  servers: [{ url: "/api" }],
  components: {
    securitySchemes: {
      ApiKey: { type: "apiKey", in: "header", name: "x-api-key" },
    },
  },
  security: [{ ApiKey: [] }],
  paths: {
    "/user": {
      get: {
        tags: ["user"],
        summary: "Listar usuarios (de aquí sacas el discordId)",
        responses: { 200: ok("Usuarios", { type: "array", items: user }), 401: errors[401] },
      },
      post: {
        tags: ["user"],
        summary: "Registrar usuario",
        requestBody: json(
          {
            name: { type: "string", example: "Diego" },
            discordId: { type: "string" },
            birthdayDay: { type: "string", example: "17" },
            birthdayMonth: { type: "string", example: "2" },
          },
          ["name", "birthdayDay", "birthdayMonth"]
        ),
        responses: { 200: ok("Usuario agregado"), ...errors },
      },
    },
    "/user/name": {
      get: {
        tags: ["user"],
        summary: "Buscar usuario por nombre",
        parameters: [query("name", { type: "string" })],
        responses: { 200: ok("Usuario", user), 401: errors[401] },
      },
    },
    "/user/discordId": {
      get: {
        tags: ["user"],
        summary: "Buscar usuario por discordId",
        parameters: [query("discordId", { type: "string" })],
        responses: { 200: ok("Usuario", user), 401: errors[401] },
      },
      post: {
        tags: ["user"],
        summary: "Asignar discordId a un usuario por nombre",
        requestBody: json(
          { name: { type: "string" }, id: { type: "string" } },
          ["name", "id"]
        ),
        responses: { 200: ok("Actualizado"), ...errors },
      },
    },
    "/user/birthday": {
      post: {
        tags: ["user"],
        summary: "Cambiar cumpleaños por nombre",
        requestBody: json(
          {
            name: { type: "string" },
            day: { type: "integer", example: 17 },
            month: { type: "integer", example: 2, description: "1-12" },
          },
          ["name", "day", "month"]
        ),
        responses: { 200: ok("Actualizado"), ...errors },
      },
    },
    "/user/{discordId}/greetings": {
      patch: {
        tags: ["user"],
        summary: "Activar o desactivar el saludo de cumpleaños",
        parameters: [
          { name: "discordId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: json({ enabled: { type: "boolean", example: false } }, ["enabled"]),
        responses: {
          200: ok("Actualizado", user),
          404: { description: "Usuario no encontrado" },
          ...errors,
        },
      },
    },
    "/birthday": {
      get: {
        tags: ["birthday"],
        summary: "Cumpleaños agrupados por mes",
        responses: { 200: ok("Cumpleaños"), 401: errors[401] },
      },
    },
    "/birthday/month": {
      get: {
        tags: ["birthday"],
        summary: "Cumpleaños de un mes",
        parameters: [
          query("month", { type: "integer", minimum: 0, maximum: 11 }, "0 = enero, 11 = diciembre"),
        ],
        responses: { 200: ok("Cumpleaños"), 401: errors[401] },
      },
    },
    "/birthday/next": {
      get: {
        tags: ["birthday"],
        summary: "Próximo cumpleaños",
        responses: { 200: ok("Próximo cumpleaños"), 401: errors[401] },
      },
    },
  },
};
