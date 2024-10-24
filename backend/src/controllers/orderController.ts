import { Request, Response, NextFunction } from "express";
import * as crypto from "crypto";
import { getUserById, updateUser } from "../repositories/user";

// Escolha do prato
export const chooseDish = async (req: Request, res: Response, next: NextFunction) => {
  const { id, dish } = req.body;

  if (!id || !dish) {
    return res.status(400).send("missing params");
  }

  const user = await getUserById(id);
  if (!user) {
    return res.status(400).send("user not found");
  }

  // Armazenar o prato escolhido temporariamente
  await updateUser(id, { currentDish: dish });

  return res.status(200).send({ message: "Dish chosen successfully" });
};

export const submitPayment = async (req: Request, res: Response, next: NextFunction) => {
  const { id, cipherPayment, iv } = req.body;

  if (!id || !cipherPayment || !iv) {
    return res.status(400).send("missing params");
  }

  const user = await getUserById(id);
  if (!user) {
    return res.status(400).send("user not found");
  }

  const sessionToken = user.session;
  if (!sessionToken) {
    return res.status(400).send("session token not found");
  }

  // Verifique se a chave de sessão tem 32 bytes (256 bits)
  const key = Buffer.from(sessionToken, 'hex');
  if (key.length !== 32) {
    return res.status(400).send("Invalid session token length");
  }

  // Verifique se o IV tem 16 bytes (128 bits)
  const ivBuffer = Buffer.from(iv, 'hex');
  if (ivBuffer.length !== 16) {
    return res.status(400).send("Invalid IV length");
  }

  try {
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, ivBuffer);
    let payment = decipher.update(cipherPayment, "hex", "utf8");
    payment += decipher.final("utf8");

    // Validar pagamento (simulado)
    if (payment !== `comprovante de pagamento do usuario ${user.id} - ${user.username}`) {
      return res.status(400).send("invalid payment");
    }

    console.log(`Pedido do usuário ${user.username} enviado para o restaurante!`);

    // Crifrar hora e retornar na api

    // Gerar um novo IV para a mensagem cifrada
    const newIv = crypto.randomBytes(16);
    const deliveryTime = "18:30";

    const cipher = crypto.createCipheriv("aes-256-cbc", key, newIv);
    let cipherText = cipher.update(`Horário de entrega: ${deliveryTime}`, "utf8", "hex");
    cipherText += cipher.final("hex");

    const newIvHex = newIv.toString("hex");

    return res.status(200).send({ 
      message: "Payment received and validated",
      deliveryTime: cipherText,
      iv: newIvHex
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).send("Error decrypting payment");
  }
};



// Envio de mensagem cifrada ao usuário
export const sendDeliveryTime = async (req: Request, res: Response, next: NextFunction) => {
  const { id, deliveryTime } = req.body;

  if (!id || !deliveryTime) {
    return res.status(400).send("missing params");
  }

  const user = await getUserById(id);
  if (!user) {
    return res.status(400).send("user not found");
  }

  const sessionToken = user.session;
  if (!sessionToken) {
    return res.status(400).send("session token not found");
  }

  const hashIv = crypto.createHash("sha256");
  hashIv.update(user.username);
  const iv = hashIv.digest("base64").slice(0, 16);

  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(sessionToken, 'hex'), iv);
  let cipherMsg = cipher.update(`Delivery time: ${deliveryTime}`, "utf8", "hex");
  cipherMsg += cipher.final("hex");

  return res.status(200).send({ cipherMsg });
};

// Recepção de mensagem cifrada pelo usuário
export const receiveMessage = async (req: Request, res: Response, next: NextFunction) => {
  const { id, cipherMsg } = req.body;

  if (!id || !cipherMsg) {
    return res.status(400).send("missing params");
  }

  const user = await getUserById(id);
  if (!user) {
    return res.status(400).send("user not found");
  }

  const sessionToken = user.session;
  if (!sessionToken) {
    return res.status(400).send("session token not found");
  }

  const hashIv = crypto.createHash("sha256");
  hashIv.update(user.username);
  const iv = hashIv.digest("base64").slice(0, 16);

  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(sessionToken, 'hex'), iv);
  let msg = decipher.update(cipherMsg, "hex", "utf8");
  msg += decipher.final("utf8");

  return res.status(200).send({ msg });
};
