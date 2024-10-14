import { CryptoDTO } from "../models/CryptoDTO";

export interface ICryptoService {
    getPublicKey(): Promise<CryptoDTO>;
    generateKey(publicKeyPath: string, privateKeyPath: string): Promise<string>;
    hashSha256(text: string): string;
    encryptMessage(publicKey: string, message: string): string;
    decryptMessage(encryptedMessage: string): string;
}