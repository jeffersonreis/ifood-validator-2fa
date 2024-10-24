import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { toast } from 'react-toastify';
import CryptoJS from 'crypto-js';

Modal.setAppElement('#root');

interface TwoFactorModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  userId: string | null
}

interface User {
  id: number;
  username: string;
  email: string;
  hash: string;
  salt: string;
  twoFactor: boolean;
  secret: string;
  session: string | null;
}

const TwoFactorModal: React.FC<TwoFactorModalProps> = ({ isOpen, onRequestClose, userId }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [receivedMessage, setReceivedMessage] = useState('');

  useEffect(() => {
    setQrCodeUrl('');
    setAuthCode('');
    setReceivedMessage('');

    const fetchQrCode = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/activate2FA`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: userId }),
        });

        if (!response.ok) {
          throw new Error('Failed to get QR code');
        }

        const data = await response.json();
        console.log("URL Activate", data)
        setQrCodeUrl(data.qrcode);
        console.log('QR Code URL', qrCodeUrl);
      } catch (error) {
        toast.error('Erro ao gerar o QR Code');
      }
    };

    if (isOpen) {
      fetchQrCode();
    }
  }, [isOpen, userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/authCode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: userId, code: authCode }),
      });

      if (!response.ok) {
        throw new Error('Failed to authenticate');
      }

      const data = await response.json();
      toast.success('Autenticação feita com sucesso!');
      console.log('RETORNO DA AUTENTICAÇÂO', data);
      setUser(data.user);
      
      // Chamar a função para enviar o pagamento cifrado
      sendEncryptedPayment(data.user);

    } catch (error) {
      toast.error('Erro na autenticação');
    }
  };

  const sendEncryptedPayment = async (user: User) => {
    try {
      const iv = CryptoJS.lib.WordArray.random(16);
      
      // Calcular a chave de sessão no frontend
      const hashSalt = CryptoJS.SHA256(user.username).toString(CryptoJS.enc.Base64);

      const sessionKey = CryptoJS.PBKDF2(authCode, hashSalt, {
        keySize: 256 / 32,
        iterations: 1000,
        hasher: CryptoJS.algo.SHA512
      });

      console.log("session key front", sessionKey.toString(CryptoJS.enc.Hex));
    
      const payment = `comprovante de pagamento do usuario ${user.id} - ${user.username}`; // simulacao do comprovante de pagamento
      const cipher = CryptoJS.AES.encrypt(payment, sessionKey, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        format: CryptoJS.format.Hex
      });

      const cipherText = cipher.ciphertext.toString(CryptoJS.enc.Hex);
      const ivHex = iv.toString(CryptoJS.enc.Hex);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/submitPayment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: user.id,
          cipherPayment: cipherText,
          iv: ivHex
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Pagamento enviado com sucesso!');
        console.log('Pagamento enviado com sucesso:', data);

        // Decifrar a mensagem de entrega
        const deliveryIv = CryptoJS.enc.Hex.parse(data.iv);

        // TS é chato, precisa ficar tipando tudo...
        const deliveryCipherText = data.deliveryTime;
        const cipherParams = CryptoJS.lib.CipherParams.create({
          ciphertext: CryptoJS.enc.Hex.parse(deliveryCipherText)
        });

        // Decifrar a mensagem
        const decipher = CryptoJS.AES.decrypt(cipherParams, sessionKey, {
          iv: deliveryIv,
          mode: CryptoJS.mode.CBC,
          format: CryptoJS.format.Hex
        });

        const message = decipher.toString(CryptoJS.enc.Utf8);
        setReceivedMessage(message);

        console.log('Mensagem de entrega:', message);

        toast.success('Mensagem de entrega recebida e decifrada com sucesso!');

      } else {
        throw new Error('Erro ao enviar pagamento');
      }
    } catch (error) {
      toast.error('Erro ao enviar pagamento');
    }
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose} contentLabel="Two Factor Authentication">
      {!receivedMessage? 
        <>
          <h2 className="text-2xl font-bold mb-4">Autenticação de 2 fatores</h2>
          {qrCodeUrl ? (
            <>
              <h2>1. Leia esse QR Code com seu aplicativo de autenticação</h2>
              <h2>2. Escreva o código de autenticação</h2>
              <h2>3. Clique em <strong>enviar</strong></h2>
              <img src={qrCodeUrl} alt="QR Code" className="mb-4" />
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="authCode">
                    Código de Autenticação
                  </label>
                  <input
                    type="text"
                    id="authCode"
                    value={authCode}
                    onChange={(e) => setAuthCode(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline max-w-xs"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Enviar
                </button>
              </form>
            </>
          ) : (
            <p>Carregando QR Code...</p>
          )}
        </>
       : 
        <>
          <h1>Pagamento Confirmado!</h1>
          <h2 className='mt-5 text-green-800 font-bold'>Mensagem de entrega: {receivedMessage}</h2>
          <button
            type="button"
            onClick={onRequestClose}
            className="mt-5 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Confirmar e fechar
          </button>
        </>
      }
    </Modal>
  );
};

export default TwoFactorModal;
