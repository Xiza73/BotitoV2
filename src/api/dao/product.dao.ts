import ErrorHandler from "../../handlers/ErrorHandler";
import ResponseBase from "../../handlers/ResponseBase";
import ResponseData from "../../handlers/ResponseData";
import Product, { IProduct } from "../models/Product";

type ProductData = {
  name: string;
  description?: string;
  price: number;
  category?: string;
  image?: string;
};

export const postProduct = async (body: ProductData) => {
  try {
    const { name, price, description, category, image } = body;
    if (!name || !price) return new ErrorHandler(400, "Datos insuficientes");
    const product: IProduct = new Product({
      name,
      price,
      ...(description && { description }),
      ...(category && { category }),
      ...(image && { image }),
    });
    await product.save();
    return ResponseBase(200, "Producto agregado correctamente");
  } catch (err) {
    return new ErrorHandler(500, "Error al agregar producto");
  }
};

export const getAllProducts = async () => {
  try {
    const products = await Product.find({});
    return ResponseData(200, "Productos obtenidos correctamente", products);
  } catch (err) {
    return new ErrorHandler(500, "Error al obtener productos");
  }
};

export const getProductById = async (id: string) => {
  try {
    const product = await Product.findById(id);
    if (!product) return new ErrorHandler(404, "Producto no encontrado");
    return ResponseData(200, "Producto obtenido correctamente", product);
  } catch (err) {
    return new ErrorHandler(500, "Error al obtener producto");
  }
};

export const updateProductById = async (id: string, body: ProductData) => {
  try {
    const { name, price, description, category, image } = body;
    if (!name || !price) return new ErrorHandler(400, "Datos insuficientes");

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name,
        price,
        ...(description && { description }),
        ...(category && { category }),
        ...(image && { image }),
      },
      { new: true }
    );
    if (!updatedProduct) return new ErrorHandler(404, "Producto no encontrado");
    return ResponseBase(200, "Producto actualizado correctamente");
  } catch (err) {
    return new ErrorHandler(500, "Error al actualizar producto");
  }
};

export const deleteProductById = async (id: string) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct) return new ErrorHandler(404, "Producto no encontrado");
    return ResponseBase(200, "Producto eliminado correctamente");
  } catch (err) {
    return new ErrorHandler(500, "Error al eliminar producto");
  }
};

export const clearAllProducts = async () => {
  try {
    await Product.deleteMany({});
    return ResponseBase(200, "Productos eliminados correctamente");
  } catch (err) {
    return new ErrorHandler(500, "Error al eliminar productos");
  }
};
