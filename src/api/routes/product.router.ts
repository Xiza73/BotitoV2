import { Router } from "express";
import * as _controller from "../controller/product.controller";

const _router: Router = Router();

// routes
_router.post("/", _controller.postProduct);
_router.get("/", _controller.getAllProducts);
_router.get("/:id", _controller.getProductById);
_router.put("/:id", _controller.updateProductById);
_router.delete("/:id", _controller.deleteProductById);
_router.delete("/", _controller.clearAllProducts);

export default _router;
