import { Request, Response, NextFunction } from "express";
import * as crypto from "crypto";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import { saveUser, getUserByUsername, updateUser, getUserById } from "../repositories/user";

// Registrar usuário
export const userRegistration = async (req: Request, res: Response, next: NextFunction) => {
  const { username, token, email } = req.body;

  if (!username || !token || !email) {
    return res.status(400).send("missing params");
  }

  const pass = username + token;
  const salt = crypto.randomBytes(16).toString("hex");

  const hash = crypto
    .scryptSync(pass, salt, 64, { cost: 2048, blockSize: 8, parallelization: 1 })
    .toString("hex");

  const newUser = {
    username,
    email,
    hash,
    salt,
    twoFactor: false
  };

  await saveUser(newUser);
  return res.status(201).send(newUser);
};

// Ativar 2FA
export const activate2FA = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).send("missing params");
  }

  const user = await getUserById(id);
  if (!user) {
    return res.status(400).send("user not found");
  }

  const secret = speakeasy.generateSecret();
  user.secret = secret.base32;
  user.twoFactor = true;

  await updateUser(id, { secret: secret.base32, twoFactor: true });

  const otp = secret.otpauth_url;
  if (otp) {
    qrcode.toDataURL(otp, (err, qrcode) => {
      if (err) return res.status(500).send("Error generating QR code");
      return res.send({ qrcode });
    });
  } else {
    return res.status(400).send("Error generating otp");
  }
};

// Login
export const login = async (req: Request, res: Response, next: NextFunction) => {
  const { username, token } = req.body;

  if (!username || !token) {
    return res.status(400).send("missing params");
  }

  const user = await getUserByUsername(username);
  if (!user) {
    return res.status(400).send("user not found");
  }

  const pass = username + token;
  const hash = crypto
    .scryptSync(pass, user.salt, 64, { cost: 2048, blockSize: 8, parallelization: 1 })
    .toString("hex");

  if (hash === user.hash) {
    return res.send({ id: user.id });
  } else {
    return res.status(401).send("wrong auth code");
  }
};

// Verificação do 2° fator
export const authCode = async (req: Request, res: Response, next: NextFunction) => {
  const { id, code } = req.body;

  if (!id || !code) {
    return res.status(400).send("missing params");
  }

  const user = await getUserById(id);
  if (!user) {
    return res.status(400).send("user not found");
  }

  const secret = user.secret;
  if (!secret) {
    return res.status(400).send("2FA not enabled for this user");
  }

  const verified = speakeasy.totp.verify({
    secret: secret,
    encoding: "base32",
    token: code,
    window: 2,
  });

  if (!verified) {
    return res.status(401).send("wrong auth code");
  }

  const hashSalt = crypto.createHash("sha256");
  hashSalt.update(user.username);
  const salt = hashSalt.digest("base64");
  
  // Gera uma chave de sessão de 32 bytes (256 bits)
  const sessionToken = crypto.pbkdf2Sync(code, salt, 1000, 32, "sha512").toString("hex");
  console.log('session key back', sessionToken)

  await updateUser(id, { session: sessionToken });

  return res.status(200).send({ user });
};
