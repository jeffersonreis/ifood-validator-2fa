import express, { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import {
  activate2FA,
  authCode,
  login,
  userRegistration,
} from "../controllers/userController";
import {
  chooseDish,
  submitPayment,
  sendDeliveryTime,
  receiveMessage,
} from "../controllers/orderController";

const router = express.Router();

router.get("/", (req: Request, res: Response) => {
  res.send("API com 2FA para pedidos de comida");
});

// Registrar usuário
router.post("/register", asyncHandler(userRegistration));

// Ativar 2° fator Google Auth
router.post("/activate2FA", asyncHandler(activate2FA));

// Login do usuário
router.post("/login", asyncHandler(login));

// Envio do 2° fator para o servidor
router.post("/authCode", asyncHandler(authCode));

// Escolha do prato
router.post("/chooseDish", asyncHandler(chooseDish));

// Envio do comprovante de pagamento
router.post("/submitPayment", asyncHandler(submitPayment));

// Envio de mensagem cifrada ao usuário
router.post("/sendDeliveryTime", asyncHandler(sendDeliveryTime));

// Recepção de mensagem cifrada pelo usuário
router.post("/receiveMessage", asyncHandler(receiveMessage));

export default router;
