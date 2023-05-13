import ErrorHandler from "../../handlers/ErrorHandler";
import ResponseBase from "../../handlers/ResponseBase";
import ResponseData from "../../handlers/ResponseData";
import GPTAllowedChannel, {
  IGPTAllowedChannel,
} from "../models/GPTAllowedChannel";

const addGPTAllowedChannel = async (channelId: string) => {
  try {
    const channel: IGPTAllowedChannel = new GPTAllowedChannel({
      channelId,
      isActive: true,
    });
    await channel.save();
    return ResponseBase(200, "Canal agregado: `Activo` para GPTmi2");
  } catch (error) {
    return new ErrorHandler(500, "Error al agregar canal");
  }
};

export const toggleGPTAllowedChannel = async (body: any) => {
  try {
    const { channelId } = body;
    if (!channelId) return new ErrorHandler(422, "Datos insuficientes");

    const channel: IGPTAllowedChannel | null = await GPTAllowedChannel.findOne({
      channelId,
    });

    if (!channel) return await addGPTAllowedChannel(channelId);

    channel.isActive = !channel.isActive;
    await channel.save();

    return ResponseBase(
      200,
      `Canal actualizado: ${
        channel.isActive ? "`Activo`" : "`Inactivo`"
      } para GPTmi2`
    );
  } catch (error) {
    return new ErrorHandler(500, "Error al actualizar canal");
  }
};

export const isGPTAllowedChannel = async (channelId: string) => {
  try {
    const channel: IGPTAllowedChannel | null = await GPTAllowedChannel.findOne({
      channelId,
    });

    if (!channel) return ResponseData(200, "No permitido", false);

    return ResponseData(
      200,
      `${channel.isActive ? "Permitido" : "No permitido"}`,
      channel.isActive
    );
  } catch (error) {
    return new ErrorHandler(500, "Error al verificar canal");
  }
};
